// components/admin/RestroSidebar.tsx
'use client';
import React from 'react';
import RestroList from './RestroList';

export default function RestroSidebar() {
  return (
    <div className="flex">
      <aside className="w-80 p-4 border-r h-screen overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Restro Master</h2>
        {/* You can add quick filters or static links here */}
      </aside>

      <main className="flex-1 p-4">
        <RestroList />
      </main>
    </div>
  );
}
