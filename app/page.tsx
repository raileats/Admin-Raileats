'use client';

import React, { useEffect, useState } from 'react';
// app/admin/page.tsx से lib तक सही relative path:
import { supabase } from '../../lib/supabaseClient';
import '../globals.css';

export default function AdminPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // अगर तुम्हारी table नाम अलग है तो 'vendors' बदल दो
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .limit(50);

        if (error) {
          console.error('Supabase error:', error);
          setVendors([]);
        } else {
          setVendors(data ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Admin — Vendors</h2>
      {loading && <div>Loading…</div>}
      {!loading && vendors.length === 0 && <div>No vendors found.</div>}
      <ul className="space-y-2">
        {vendors.map((v: any) => (
          <li key={v.id ?? v.vendor_id ?? JSON.stringify(v)} className="p-3 border rounded shadow-sm">
            <div className="font-medium">{v.name ?? v.vendor_name ?? 'Unnamed'}</div>
            <div className="text-sm text-gray-600">{v.station_code ?? v.location ?? ''}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
