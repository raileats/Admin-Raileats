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
    // collapse only when focus leaves entire sidebar
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setKeyboardExpanded(false);
    }
  };

  // effective collapsed: if parent says collapsed OR not interactive focus/hover
  const effectiveCollapsed = collapsed ? true : false;

  return (
    // data-keyboard-expanded used by CSS to force expanded state for keyboard users
    <aside
      className={`admin-sidebar`}
      onFocus={handleFocusIn}
      onBlur={handleFocusOut}
      data-keyboard-expanded={keyboardExpanded ? 'true' : 'false'}
      data-collapsed={effectiveCollapsed ? 'true' : 'false'}
      aria-label="Sidebar"
    >
      <div className="sidebar-inner">
        <div className="sidebar-logo text-center mb-3">
          <img src="/logo.png" alt="RailEats" className="sidebar-logo-img" />
          <span className="sidebar-brand">RailEats Admin</span>
        </div>

        <ul className="sidebar-nav">
          {menu.map((m) => (
            <li key={m.href} className="sidebar-item">
              <Link href={m.href} className="sidebar-link" title={m.label}>
                <div className="bubble-icon" aria-hidden>
                  <i className={m.icon} />
                </div>
                <span className="sidebar-label">{m.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer mt-auto">
          <Link href="/admin/logout" className="btn-logout" title="Logout">
            <div className="bubble-icon" aria-hidden>
              <i className="fa fa-sign-out-alt" />
            </div>
            <span className="sidebar-label">Logout</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
