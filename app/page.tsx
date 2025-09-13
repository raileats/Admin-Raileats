'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // <-- use centralized client (anon)
import '../../app/globals.css';

export default function AdminStationsPage() {
  const [user, setUser] = useState<any>({ email: 'unknown' });
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // get session user if any (example)
    (async () => {
      try {
        const { data: { user: u } = {} } = await supabase.auth.getUser().catch(() => ({} as any));
        if (u) setUser(u);
      } catch (err) {
        console.warn('No auth user', err);
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

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser({ email: 'signed out' });
    } catch (err) {
      console.error('signOut error', err);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Stations — Admin</h1>
          <div className="flex gap-2 items-center">
            <div className="text-sm">{user?.email ?? '—'}</div>
            <button className="px-3 py-1 border rounded" onClick={signOut}>Sign out</button>
          </div>
        </div>

        <div className="mb-4">
          <button className="px-3 py-2 bg-green-600 text-white rounded">Add Station</button>
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
