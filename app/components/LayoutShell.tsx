// app/components/LayoutShell.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // read persisted preference on mount
  useEffect(() => {
    try {
      const v = localStorage.getItem('ra_sidebar_collapsed');
      if (v !== null) setCollapsed(v === '1');
    } catch (e) {
      // ignore in SSR environments
    }
  }, []);

  // persist preference
  useEffect(() => {
    try {
      localStorage.setItem('ra_sidebar_collapsed', collapsed ? '1' : '0');
    } catch (e) {}
  }, [collapsed]);

  const toggle = () => setCollapsed((s) => !s);

  return (
    <div className={`admin-shell d-flex ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <div className="main-content flex-grow-1">
        <Header collapsed={collapsed} onToggle={toggle} />
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
