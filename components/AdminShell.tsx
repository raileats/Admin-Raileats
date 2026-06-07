"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Home,
  ListOrdered,
  LogOut,
  MapPin,
  Menu,
  Train,
  Users,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import AuthGuard from "@/components/admin/AuthGuard";

const supabaseNotify = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type User = {
  id?: string;
  user_id?: string;
  user_type?: string;
  name?: string | null;
  mobile?: string | null;
  photo_url?: string | null;
  email?: string | null;
} | null;

type Props = {
  children: React.ReactNode;
  currentUser?: User;
  requireAuth?: boolean;
};

const adminNavItems = [
  { href: "/admin/home", label: "Dashboard", icon: Home },
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/restros", label: "Restro Master", icon: Utensils },
  { href: "/admin/menu", label: "Menu", icon: WalletCards },
  { href: "/admin/trains", label: "Trains", icon: Train },
  { href: "/admin/stations", label: "Stations", icon: MapPin },
  { href: "/admin/users", label: "Users", icon: Users },
] as const;

function userLabel(user?: User) {
  if (!user) return "Admin";
  return user.name || user.mobile || user.email || "Admin";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin/home") {
    return pathname === "/admin" || pathname === "/admin/home";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({
  children,
  currentUser,
  requireAuth = true,
}: Props) {
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hideChrome =
    pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  const playGlobalNewOrderSound = async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/new-order.mp3");
        audioRef.current.preload = "auto";
        audioRef.current.volume = 1;
      }

      audioRef.current.muted = false;
      audioRef.current.volume = 1;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (e) {
      console.log("Global MP3 failed", e);
    }

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      const ctx = new AudioContextClass();
      await ctx.resume();

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;

      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.log("Global fallback beep failed", e);
    }
  };

  useEffect(() => {
    if (hideChrome) return;

    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 1;

    const unlockAudio = async () => {
      try {
        if (!audioRef.current) return;

        audioRef.current.muted = true;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.muted = false;

        console.log("Admin audio unlocked");
      } catch (e) {
        console.log("Audio unlock failed", e);
      }
    };

    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [hideChrome]);

  useEffect(() => {
    if (hideChrome) return;

    const channel = supabaseNotify
      .channel("admin-global-new-order-notification")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Orders" },
        async (payload) => {
          console.log("GLOBAL NEW ORDER:", payload);

          await playGlobalNewOrderSound();

          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("🚆 New RailEats Order", {
                body: `${payload.new?.customerName || "Customer"} • ${
                  payload.new?.stationName || ""
                }`,
              });
            }
          } catch (e) {}
        }
      )
      .subscribe((status) => {
        console.log("Global order notification status:", status);
      });

    return () => {
      supabaseNotify.removeChannel(channel);
    };
  }, [hideChrome]);

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      window.location.replace("/admin/login");
    }
  };

  if (hideChrome) return <>{children}</>;

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-4">
        <img
          src="/logo.png"
          alt="RailEats"
          className="h-10 w-10 shrink-0 rounded-md object-contain"
        />

        <div
          className={
            mobile
              ? "whitespace-nowrap"
              : "whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100"
          }
        >
          <div className="text-base font-bold leading-tight">RailEats Admin</div>
          <div className="text-xs font-medium text-slate-500">Operations</div>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => mobile && setMobileOpen(false)}
              className={[
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              <Icon size={20} className="shrink-0" />
              <span
                className={
                  mobile
                    ? "whitespace-nowrap"
                    : "whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100"
                }
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className="flex h-11 w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <LogOut size={20} className="shrink-0" />
          <span
            className={
              mobile
                ? "whitespace-nowrap"
                : "whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100"
            }
          >
            Logout
          </span>
        </button>
      </div>
    </>
  );

  const shell = (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <SidebarContent mobile />
      </aside>

      <div className="flex min-h-screen">
        <aside className="group/sidebar hidden w-20 shrink-0 overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 hover:w-56 lg:flex lg:flex-col">
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>

              <div>
                <div className="text-lg font-bold leading-tight">Admin Panel</div>
                <div className="hidden text-xs font-medium text-slate-500 sm:block">
                  RailEats operations console
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold">
                  {userLabel(currentUser)}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-semibold text-blue-600 underline"
                >
                  Logout
                </button>
              </div>

              {currentUser?.photo_url ? (
                <img
                  src={currentUser.photo_url}
                  alt="Admin"
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Users size={20} />
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-7">
            <div className="mx-auto w-full max-w-[1560px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );

  return requireAuth ? <AuthGuard>{shell}</AuthGuard> : shell;
}
