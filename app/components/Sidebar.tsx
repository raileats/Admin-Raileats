// app/components/Sidebar.tsx
"use client";
import Link from "next/link";

const menu = [
  { href: "/admin", label: "Dashboard", icon: "fa-solid fa-chart-line" },
  { href: "/admin/orders", label: "Orders", icon: "fa-solid fa-receipt" },
  { href: "/admin/outlets", label: "Outlets", icon: "fa-solid fa-store" },
  { href: "/admin/restros", label: "Restro Master", icon: "fa-solid fa-utensils" },
  { href: "/admin/menu", label: "Menu", icon: "fa-solid fa-book-open" },
  { href: "/admin/trains", label: "Trains", icon: "fa-solid fa-train" },
  { href: "/admin/stations", label: "Stations", icon: "fa-solid fa-location-dot" },
  { href: "/admin/users", label: "Users", icon: "fa-solid fa-users" },
];

export default function Sidebar() {
  return (
    <aside className="admin-sidebar p-3 d-flex flex-column">
      <div className="text-center mb-4">
        <img src="/logo.png" alt="RailEats" height={60} />
      </div>

      <ul className="nav flex-column gap-2">
        {menu.map((m) => (
          <li key={m.href}>
            <Link href={m.href} className="nav-link d-flex align-items-center gap-3">
              <div className="bubble-icon">
                <i className={m.icon}></i>
              </div>
              <span>{m.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
