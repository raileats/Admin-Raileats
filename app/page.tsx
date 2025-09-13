// app/admin/page.tsx  (paste replacing the old createClient usage)
'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // <-- from app/admin -> go up two levels to root/lib
import '../globals.css';

export default function AdminPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('vendors').select('*').limit(50);
      if (error) {
        console.error(error);
        setVendors([]);
      } else setVendors(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Admin — Vendors</h2>
      {loading ? <div>Loading…</div> : (vendors.length ? (
        <ul className="space-y-2">
          {vendors.map((v:any) => (
            <li key={v.id ?? v.vendor_id} className="p-3 border rounded shadow-sm">
              <div className="font-medium">{v.name ?? v.vendor_name}</div>
              <div className="text-sm text-gray-600">{v.station_code ?? v.location ?? ''}</div>
            </li>
          ))}
        </ul>
      ) : <div>No vendors found.</div>)}
    </div>
  );
}
