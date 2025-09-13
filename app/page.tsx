'use client';

import React, { useEffect, useState } from 'react';
import '../globals.css';
import { supabase } from '../../lib/supabaseClient';

export default function AdminStationsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) setUserEmail(data.user.email ?? null);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('vendors').select('*').limit(50);
        if (error) {
          console.error('vendors fetch error', error);
          setVendors([]);
        } else {
          setVendors(data ?? []);
        }
      } catch (err) {
        console.error(err);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Admin — Vendors</h1>
          <div className="text-sm">{userEmail ?? 'Guest'}</div>
        </div>

        <div className="mb-4">
          <button className="px-3 py-2 bg-green-600 text-white rounded">Add Vendor</button>
        </div>

        <div>
          {loading ? (
            <div>Loading vendors…</div>
          ) : (
            <ul className="space-y-2">
              {vendors.map((v: any) => (
                <li key={v.id ?? v.vendor_id} className="p-3 border rounded">
                  <div className="font-medium">{v.name ?? v.vendor_name}</div>
                  <div className="text-sm text-gray-600">{v.station_code ?? v.location ?? ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
