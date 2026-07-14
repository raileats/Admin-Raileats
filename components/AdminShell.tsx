// components/AdminShell.tsx
"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

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

/* =========================================================
   SUPABASE REALTIME CLIENT
   ========================================================= */

const supabaseNotify = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* =========================================================
   TYPES
   ========================================================= */

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
   SIDEBAR ITEMS

   Sirf already-supported Lucide icons use kiye hain.
   ========================================================= */

const adminNavItems = [
  {
    href: "/admin/home",
    label: "Dashboard",
    icon: Home,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ListOrdered,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
  },
  {
    href: "/admin/restro-rds",
    label: "Restro RDS",
    icon: WalletCards,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    href: "/admin/restros",
    label: "Restro Master",
    icon: Utensils,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
  },
  {
    href: "/admin/menu",
    label: "Menu",
    icon: WalletCards,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
  },
  {
    href: "/admin/trains",
    label: "Trains",
    icon: Train,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
  {
    href: "/admin/stations",
    label: "Stations",
    icon: MapPin,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: Users,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
  },
  {
    href: "/admin/website/hero-slider",
    label: "Hero Sliders",
    icon: WalletCards,
    iconColor: "text-pink-600",
    iconBg: "bg-pink-50",
  },
] as const;

/* =========================================================
   HELPERS
   ========================================================= */

function userLabel(user?: User) {
  if (!user) {
    return "Admin";
  }

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
    pathname.startsWith(
      `${href}/`
    )
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AdminShell({
  children,
  currentUser,
  requireAuth = true,
}: Props) {
  const pathname =
    usePathname() || "";

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const audioRef =
    useRef<HTMLAudioElement | null>(
      null
    );

  const hideChrome =
    pathname === "/admin/login" ||
    pathname.startsWith(
      "/admin/login/"
    );

  /* =======================================================
     GLOBAL ORDER SOUND
     ======================================================= */

  const playGlobalNewOrderSound =
    async () => {
      try {
        if (!audioRef.current) {
          audioRef.current =
            new Audio(
              "/sounds/new-order.mp3"
            );

          audioRef.current.preload =
            "auto";

          audioRef.current.volume =
            1;
        }

        audioRef.current.muted =
          false;

        audioRef.current.volume =
          1;

        audioRef.current.currentTime =
          0;

        await audioRef.current.play();
      } catch (e) {
        console.log(
          "Global MP3 failed",
          e
        );
      }

      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as any)
            .webkitAudioContext;

        const ctx =
          new AudioContextClass();

        await ctx.resume();

        const oscillator =
          ctx.createOscillator();

        const gain =
          ctx.createGain();

        oscillator.type =
          "sine";

        oscillator.frequency.value =
          880;

        gain.gain.setValueAtTime(
          0.8,
          ctx.currentTime
        );

        gain.gain
          .exponentialRampToValueAtTime(
            0.01,
            ctx.currentTime +
              0.8
          );

        oscillator.connect(gain);
        gain.connect(
          ctx.destination
        );

        oscillator.start();

        oscillator.stop(
          ctx.currentTime +
            0.8
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
    if (hideChrome) {
      return;
    }

    audioRef.current =
      new Audio(
        "/sounds/new-order.mp3"
      );

    audioRef.current.preload =
      "auto";

    audioRef.current.volume =
      1;

    const unlockAudio =
      async () => {
        try {
          if (
            !audioRef.current
          ) {
            return;
          }

          audioRef.current.muted =
            true;

          await audioRef.current.play();

          audioRef.current.pause();

          audioRef.current.currentTime =
            0;

          audioRef.current.muted =
            false;

          console.log(
            "Admin audio unlocked"
          );
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
      {
        once: true,
      }
    );

    window.addEventListener(
      "touchstart",
      unlockAudio,
      {
        once: true,
      }
    );

    window.addEventListener(
      "keydown",
      unlockAudio,
      {
        once: true,
      }
    );

    if (
      "Notification" in
        window &&
      Notification.permission ===
        "default"
    ) {
      Notification
        .requestPermission()
        .catch(() => {});
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
    if (hideChrome) {
      return;
    }

    const channel =
      supabaseNotify
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
                "Notification" in
                  window &&
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
            } catch (e) {
              console.log(
                "Browser notification failed",
                e
              );
            }
          }
        )
        .subscribe(
          (status) => {
            console.log(
              "Global order notification status:",
              status
            );
          }
        );

    return () => {
      supabaseNotify
        .removeChannel(
          channel
        );
    };
  }, [hideChrome]);

  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout =
    async (
      e?: React.MouseEvent
    ) => {
      e?.preventDefault();

      try {
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            credentials:
              "include",
          }
        );
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
     SIDEBAR CONTENT
     ======================================================= */

  const SidebarContent = ({
    mobile = false,
  }: {
    mobile?: boolean;
  }) => (
    <>
      {/* Logo Header */}

      <div className="flex h-24 shrink-0 items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-white via-blue-50/40 to-white px-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-gradient-to-br from-yellow-100 to-orange-50 shadow-sm">
          <img
            src="/logo.png"
            alt="RailEats"
            className="h-10 w-10 rounded-xl object-contain"
          />
        </div>

        <div className="min-w-0 whitespace-nowrap">
          <div className="truncate text-[17px] font-extrabold leading-tight tracking-tight text-slate-950">
            RailEats Admin
          </div>

          <div className="mt-0.5 text-xs font-semibold tracking-wide text-slate-500">
            Operations
          </div>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
        {adminNavItems.map(
          (item) => {
            const Icon =
              item.icon;

            const active =
              isActivePath(
                pathname,
                item.href
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={() =>
                  mobile &&
                  setMobileOpen(
                    false
                  )
                }
                className={[
                  "group/navitem relative flex h-12 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-bold transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-slate-100 to-blue-50 text-slate-950 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                ].join(" ")}
              >
                {active && (
                  <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-blue-600" />
                )}

                <span
                  className={[
                    "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 group-hover/navitem:scale-105",
                    item.iconBg,
                    active
                      ? "shadow-sm ring-1 ring-white"
                      : "",
                  ].join(" ")}
                >
                  <Icon
                    size={20}
                    strokeWidth={2.2}
                    className={[
                      "shrink-0",
                      item.iconColor,
                    ].join(" ")}
                  />
                </span>

                <span className="min-w-0 flex-1 truncate whitespace-nowrap">
                  {item.label}
                </span>

                {active && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.10)]" />
                )}
              </Link>
            );
          }
        )}
      </nav>

      {/* Logout */}

      <div className="shrink-0 border-t border-slate-200 bg-slate-50/70 p-3">
        <button
          type="button"
          onClick={
            handleLogout
          }
          title="Logout"
          className="group/logout flex h-12 w-full items-center gap-3 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover/logout:bg-red-100">
            <LogOut
              size={20}
              strokeWidth={2.2}
            />
          </span>

          <span className="whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>
    </>
  );

  /* =======================================================
     SHELL
     ======================================================= */

  const shell = (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Mobile Overlay */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      {/* Mobile Sidebar */}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:hidden",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <SidebarContent mobile />
      </aside>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar — screenshot jaisa always expanded */}

        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-[4px_0_20px_rgba(15,23,42,0.035)] lg:flex">
          <SidebarContent />
        </aside>

        {/* Right Side */}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}

          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-[0_1px_8px_rgba(15,23,42,0.035)] backdrop-blur-xl lg:px-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileOpen(
                    true
                  )
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>

              <div>
                <div className="text-lg font-extrabold leading-tight tracking-tight text-slate-950">
                  Admin Panel
                </div>

                <div className="hidden text-xs font-semibold text-slate-500 sm:block">
                  RailEats operations
                  console
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-bold text-slate-900">
                  {userLabel(
                    currentUser
                  )}
                </div>

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="text-xs font-semibold text-blue-600 underline decoration-blue-200 underline-offset-2 hover:text-blue-700"
                >
                  Logout
                </button>
              </div>

              {currentUser
                ?.photo_url ? (
                <div className="rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 p-[2px] shadow-md">
                  <img
                    src={
                      currentUser.photo_url
                    }
                    alt="Admin"
                    className="h-10 w-10 rounded-full border-2 border-white object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 p-[2px] shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-50 text-blue-700">
                    <Users
                      size={20}
                    />
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}

          <main className="flex-1 px-4 py-6 lg:px-7">
            <div className="mx-auto w-full max-w-[1560px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );

  return requireAuth ? (
    <AuthGuard>
      {shell}
    </AuthGuard>
  ) : (
    shell
  );
}
