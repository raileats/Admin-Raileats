// app/components/Sidebar.tsx
'use client';
import React, { useState } from 'react';
import Link from 'next/link';

type Item = { href: string; label: string; icon: string };
const menu: Item[] = [
  { href: '/admin', label: 'Dashboard', icon: 'fa-solid fa-chart-line' },
  { href: '/admin/orders', label: 'Orders', icon: 'fa-solid fa-receipt' },
  { href: '/admin/restros', label: 'Restro Master', icon: 'fa-solid fa-utensils' },
  { href: '/admin/menu', label: 'Menu', icon: 'fa-solid fa-book-open' },
  { href: '/admin/trains', label: 'Trains', icon: 'fa-solid fa-train' },
  { href: '/admin/stations', label: 'Stations', icon: 'fa-solid fa-location-dot' },
  { href: '/admin/users', label: 'Users', icon: 'fa-solid fa-users' },
];

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const [keyboardExpanded, setKeyboardExpanded] = useState(false);

  const handleFocusIn = () => setKeyboardExpanded(true);
  const handleFocusOut = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setKeyboardExpanded(false);
  };

  // collapsedEffective = true when parent forced collapsed OR not keyboardExpanded
  const collapsedEffective = !!collapsed && !keyboardExpanded;

  return (
    <aside
      className="admin-sidebar"
      onFocus={handleFocusIn}
      onBlur={handleFocusOut}
      data-keyboard-expanded={keyboardExpanded ? 'true' : 'false'}
      data-collapsed={collapsedEffective ? 'true' : 'false'}
      aria-label="Sidebar"
    >
      <div className="sidebar-inner">
        <div className="logo-wrap">
          <img src="/logo.png" alt="RailEats" />
          <span className="sidebar-brand">RailEats Admin</span>
        </div>

        <ul className="nav flex-column">
          {menu.map((m) => (
            <li key={m.href} className="sidebar-item" >
              <Link href={m.href} className={`nav-link ${collapsedEffective ? 'collapsed-link' : ''}`} title={m.label}>
                <div className="bubble-icon" aria-hidden>
                  <i className={m.icon} />
                </div>

                {/* inline label (visible when sidebar expanded) */}
                <span className="sidebar-label">{m.label}</span>

                {/* tooltip shown only when sidebar is collapsed and user hovers this item */}
                <span className="sidebar-tooltip" aria-hidden>
                  {m.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <Link href="/admin/logout" className={`btn btn-sm btn-outline-secondary w-100 ${collapsedEffective ? 'text-center' : ''}`}>
            <div className="bubble-icon" aria-hidden>
              <i className="fa fa-sign-out-alt" />
            </div>
            <span className="sidebar-label">Logout</span>
            <span className="sidebar-tooltip" aria-hidden>Logout</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
