// components/AdminShell.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import * as LucideIcons from "lucide-react";
import AuthGuard from "@/components/admin/AuthGuard";

/*
 * Namespace import use kiya hai taaki purane lucide-react version me
 * koi requested icon missing ho to build fail na ho.
 */
const LayoutDashboard =
  (LucideIcons as any).LayoutDashboard ||
  (LucideIcons as any).Home;

const ListOrdered =
  (LucideIcons as any).ListOrdered ||
  (LucideIcons as any).List;

const UtensilsCrossed =
  (LucideIcons as any).UtensilsCrossed ||
  (LucideIcons as any).Utensils;

const ChefHat =
  (LucideIcons as any).ChefHat ||
  (LucideIcons as any).Utensils;

const TrainFront =
  (LucideIcons as any).TrainFront ||
  (LucideIcons as any).Train;

const MapPin =
  (LucideIcons as any).MapPin;

const Users =
  (LucideIcons as any).Users;

const UserCog =
  (LucideIcons as any).UserCog ||
  (LucideIcons as any).Users;

const LayoutTemplate =
  (LucideIcons as any).LayoutTemplate ||
  (LucideIcons as any).Layout ||
  (LucideIcons as any).WalletCards ||
  (LucideIcons as any).CreditCard;

const PaymentsIcon =
  (LucideIcons as any).WalletCards ||
  (LucideIcons as any).CreditCard ||
  (LucideIcons as any).Landmark ||
  IndianRupeeBadgeIcon;

const LogOut =
  (LucideIcons as any).LogOut;

const Menu =
  (LucideIcons as any).Menu;

const X =
  (LucideIcons as any).X;

/* =========================================================
   CUSTOM INDIAN RUPEE BADGE ICON

   Lucide package version par depend nahi karta.
   Isliye Next 13.4 + old lucide-react me bhi work karega.
   ========================================================= */

type NavIconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function IndianRupeeBadgeIcon({
  size = 20,
  strokeWidth = 2,
  className = "",
}: NavIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />

      <path
        d="M8 7H16"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      <path
        d="M8 10H16"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      <path
        d="M8 7H11.2C13.3 7 14.5 8.1 14.5 9.8C14.5 11.5 13.2 12.6 11.1 12.6H8.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9.3 12.6L14.8 18"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   SUPABASE REALTIME CLIENT
   ========================================================= */

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

/* =========================================================
   ADMIN NAVIGATION
   ========================================================= */

const adminNavItems = [
  {
    href: "/admin/home",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ListOrdered,
    color: "text-orange-500",
  },
  {
  href: "/admin/re-rds",
  label: "RE RDS",
  icon: IndianRupeeBadgeIcon,
  color: "text-emerald-600",
},
  {
    href: "/admin/restro-rds",
    label: "Restro RDS",
    icon: IndianRupeeBadgeIcon,
    color: "text-emerald-600",
  },
  {
    href: "/admin/restros",
    label: "Restro Master",
    icon: UtensilsCrossed,
    color: "text-rose-500",
  },
  {
    href: "/admin/menu",
    label: "Menu",
    icon: ChefHat,
    color: "text-amber-500",
  },
  {
    href: "/admin/trains",
    label: "Trains",
    icon: TrainFront,
    color: "text-purple-500",
  },
  {
    href: "/admin/stations",
    label: "Stations",
    icon: MapPin,
    color: "text-red-500",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: UserCog,
    color: "text-cyan-600",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: Users,
    color: "text-indigo-500",
  },
  {
    href: "/admin/website/hero-slider",
    label: "Hero Sliders",
    icon: LayoutTemplate,
    color: "text-pink-500",
  },
  {
    href: "/admin/payment-requests",
    label: "Payments",
    icon: PaymentsIcon,
    color: "text-emerald-600",
  },
] as const;

function userLabel(user?: User) {
  if (!user) return "Admin";

  return (
    user.name ||
    user.mobile ||
    user.email ||
    "Admin"
  );
}

function isActivePath(
  pathname: string,
  href: string
) {
  if (href === "/admin/home") {
    return (
      pathname === "/admin" ||
      pathname === "/admin/home"
    );
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function AdminShell({
  children,
  currentUser,
  requireAuth = true,
}: Props) {
  const pathname = usePathname() || "";

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const hideChrome =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/");

  /* =======================================================
     GLOBAL ORDER SOUND
     ======================================================= */

  const playGlobalNewOrderSound = async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(
          "/sounds/new-order.mp3"
        );

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
        window.AudioContext ||
        (window as any).webkitAudioContext;

      const ctx = new AudioContextClass();

      await ctx.resume();

      const oscillator =
        ctx.createOscillator();

      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;

      gain.gain.setValueAtTime(
        0.8,
        ctx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + 0.8
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();

      oscillator.stop(
        ctx.currentTime + 0.8
      );
    } catch (e) {
      console.log(
        "Global fallback beep failed",
        e
      );
    }
  };

  /* =======================================================
     AUDIO UNLOCK
     ======================================================= */

  useEffect(() => {
    if (hideChrome) return;

    audioRef.current = new Audio(
      "/sounds/new-order.mp3"
    );

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
        console.log(
          "Audio unlock failed",
          e
        );
      }
    };

    window.addEventListener(
      "click",
      unlockAudio,
      { once: true }
    );

    window.addEventListener(
      "touchstart",
      unlockAudio,
      { once: true }
    );

    window.addEventListener(
      "keydown",
      unlockAudio,
      { once: true }
    );

    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(
        () => {}
      );
    }

    return () => {
      window.removeEventListener(
        "click",
        unlockAudio
      );

      window.removeEventListener(
        "touchstart",
        unlockAudio
      );

      window.removeEventListener(
        "keydown",
        unlockAudio
      );
    };
  }, [hideChrome]);

  /* =======================================================
     SUPABASE REALTIME
     ======================================================= */

  useEffect(() => {
    if (hideChrome) return;

    const channel = supabaseNotify
      .channel(
        "admin-global-new-order-notification"
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Orders",
        },
        async (payload) => {
          console.log(
            "GLOBAL NEW ORDER:",
            payload
          );

          await playGlobalNewOrderSound();

          try {
            if (
              "Notification" in window &&
              Notification.permission ===
                "granted"
            ) {
              new Notification(
                "🚆 New RailEats Order",
                {
                  body: `${
                    payload.new
                      ?.customerName ||
                    "Customer"
                  } • ${
                    payload.new
                      ?.stationName ||
                    ""
                  }`,
                }
              );
            }
          } catch (e) {}
        }
      )
      .subscribe((status) => {
        console.log(
          "Global order notification status:",
          status
        );
      });

    return () => {
      supabaseNotify.removeChannel(channel);
    };
  }, [hideChrome]);

  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = async (
    e?: React.MouseEvent
  ) => {
    e?.preventDefault();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(
        "Logout failed",
        err
      );
    } finally {
      window.location.replace(
        "/admin/login"
      );
    }
  };

  if (hideChrome) {
    return <>{children}</>;
  }

  /* =======================================================
     SIDEBAR
     ======================================================= */

  const SidebarContent = ({
    mobile = false,
  }: {
    mobile?: boolean;
  }) => (
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
          <div className="text-base font-bold leading-tight">
            RailEats Admin
          </div>

          <div className="text-xs font-medium text-slate-500">
            Operations
          </div>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
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

          const active =
            item.label === "Payments"
              ? pathname === "/admin/payment-requests" ||
                pathname.startsWith("/admin/payment-requests/") ||
                pathname === "/admin/deposited-update" ||
                pathname.startsWith("/admin/deposited-update/")
              : isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() =>
                mobile &&
                setMobileOpen(false)
              }
              className={[
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                active
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              <Icon
                size={20}
                strokeWidth={2}
                className={[
                  "shrink-0 transition-transform duration-200",
                  item.color,
                  active ? "scale-105" : "",
                ].join(" ")}
              />

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
          className="flex h-11 w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut
            size={20}
            className="shrink-0 text-red-500"
          />

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

  /* =======================================================
     MAIN SHELL
     ======================================================= */

  const shell = (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 lg:hidden",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
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
                onClick={() =>
                  setMobileOpen(true)
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>

              <div>
                <div className="text-lg font-bold leading-tight">
                  Admin Panel
                </div>

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
            <div className="mx-auto w-full max-w-[1560px]">
              {pathname === "/admin/payment-requests" ||
              pathname.startsWith("/admin/payment-requests/") ||
              pathname === "/admin/deposited-update" ||
              pathname.startsWith("/admin/deposited-update/") ? (
                <div className="mb-5 rounded-xl border border-slate-200 bg-white p-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/admin/payment-requests"
                      className={[
                        "flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition",
                        pathname === "/admin/payment-requests" ||
                        pathname.startsWith("/admin/payment-requests/")
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      Payment Request
                    </Link>

                    <Link
                      href="/admin/deposited-update"
                      className={[
                        "flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition",
                        pathname === "/admin/deposited-update" ||
                        pathname.startsWith("/admin/deposited-update/")
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      Restaurant Deposit Update
                    </Link>
                  </div>
                </div>
              ) : null}

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );

  return requireAuth ? (
    <AuthGuard>{shell}</AuthGuard>
  ) : (
    shell
  );
}
