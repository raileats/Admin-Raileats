"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import AuthGuard from "@/components/admin/AuthGuard";

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
  {
    href: "/admin/home",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ListOrdered,
  },
  {
    href: "/admin/restros",
    label: "Restro Master",
    icon: Utensils,
  },
  {
    href: "/admin/menu",
    label: "Menu",
    icon: WalletCards,
  },
  {
    href: "/admin/trains",
    label: "Trains",
    icon: Train,
  },
  {
    href: "/admin/stations",
    label: "Stations",
    icon: MapPin,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
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
  const hideChrome = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

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

  const shell = (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-52 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-4">
            <img src="/logo.png" alt="RailEats" className="h-10 w-10 rounded-md object-contain" />
            <div>
              <div className="text-base font-bold leading-tight">RailEats Admin</div>
              <div className="text-xs font-medium text-slate-500">Operations</div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
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
                <div className="text-sm font-semibold">{userLabel(currentUser)}</div>
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
