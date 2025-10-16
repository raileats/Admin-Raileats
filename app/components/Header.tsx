// app/components/Header.tsx
'use client';
import React from 'react';

type Props = {
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function Header({ collapsed = false, onToggle }: Props) {
  return (
    <nav className="admin-header d-flex align-items-center justify-content-between px-3 py-2">
      <div className="d-flex align-items-center gap-2">
        {/* Hamburger / collapse button */}
        <button
          aria-label={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
          onClick={onToggle}
          className="btn btn-sm btn-outline-secondary me-2 d-md-none d-lg-inline-flex"
        >
          <i className="fa fa-bars" />
        </button>

        <img src="/logo.png" alt="RailEats" height={36} />
        <h5 className="m-0 fw-bold text-dark ms-2 d-none d-md-block">RailEats Admin</h5>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="text-end small d-none d-md-block">
          <div className="fw-semibold">ops@raileats.in</div>
          <a href="/admin/logout" className="logout-link">Logout</a>
        </div>
        <img src="/default-avatar.png" alt="Admin" className="rounded-circle border" width={40} height={40} />
      </div>
    </nav>
  );
}
