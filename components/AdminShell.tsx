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

   Existing icons only use kiye gaye hain taaki
   old lucide-react version me build error na aaye.
   ========================================================= */

const adminNavItems = [
  {
    href: "/admin/home",
    label: "Dashboard",
    icon: Home,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    activeBg:
      "bg-gradient-to-r from-blue-600 to-blue-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(37,99,235,0.24)]",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ListOrdered,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
    activeBg:
      "bg-gradient-to-r from-orange-500 to-amber-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(249,115,22,0.24)]",
  },
  {
    href: "/admin/restro-rds",
    label: "Restro RDS",
    icon: WalletCards,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    activeBg:
      "bg-gradient-to-r from-emerald-600 to-green-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(5,150,105,0.24)]",
  },
  {
    href: "/admin/restros",
    label: "Restro Master",
    icon: Utensils,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
    activeBg:
      "bg-gradient-to-r from-rose-600 to-pink-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(225,29,72,0.24)]",
  },
  {
    href: "/admin/menu",
    label: "Menu",
    icon: WalletCards,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    activeBg:
      "bg-gradient-to-r from-amber-500 to-yellow-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(245,158,11,0.24)]",
  },
  {
    href: "/admin/trains",
    label: "Trains",
    icon: Train,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    activeBg:
      "bg-gradient-to-r from-violet-600 to-purple-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(124,58,237,0.24)]",
  },
  {
    href: "/admin/stations",
    label: "Stations",
    icon: MapPin,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    activeBg:
      "bg-gradient-to-r from-red-500 to-orange-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(239,68,68,0.24)]",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50",
    activeBg:
      "bg-gradient-to-r from-cyan-600 to-sky-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(8,145,178,0.24)]",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: Users,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
    activeBg:
      "bg-gradient-to-r from-indigo-600 to-blue-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(79,70,229,0.24)]",
  },
  {
    href: "/admin/website/hero-slider",
    label: "Hero Sliders",
    icon: WalletCards,
    iconColor: "text-pink-600",
    iconBg: "bg-pink-50",
    activeBg:
      "bg-gradient-to-r from-pink-600 to-fuchsia-500",
    activeShadow:
      "shadow-[0_8px_20px_rgba(219,39,119,0.24)]",
  },
] as const;

/* =========================================================
   HELPERS
   ========================================================= */

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
     GLOBAL NEW ORDER SOUND
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

        gain.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + 0.8
        );

        oscillator.connect(gain);
        gain.connect(
          ctx.destination
        );

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
      "Notification" in window &&
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
     SUPABASE REALTIME NOTIFICATION
     ======================================================= */

  useEffect(() => {
    if (hideChrome) return;

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
            } catch (e) {}
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
      supabaseNotify.removeChannel(
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
      {/* LOGO AREA */}
      <div className="relative flex h-24 items-center gap-3 overflow-hidden border-b border
