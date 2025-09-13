'use client';

import React, { useEffect, useState } from 'react';
import '../globals.css'; // app/admin -> go one level up to app/
import { supabase } from '../../lib/supabaseClient'; // app/admin -> ../../lib

type Vendor = {
  id?: string | number;
  vendor_id?: string | number;
  name?: string;
  vendor_name?: string;
  station_code?: string;
  location?: string;
  is_active?: boolean;
};

export default function AdminVendorsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // get current user (if using supabase auth in client)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) setUserEmail(data.user.email ?? null);
      } catch (err) {
        // ignore silently
        console.warn('auth.getUser error', err);
      }
    })();
  }, []);

  // fetch vendors (example read)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data, error } = await supabase
          .from('vendors') // adjust table name if different
          .select('id,vendor_id,name,vendor_name,station_code,location,is_active')
          .order('name', { ascending: true })
          .limit(200);

        if (error) {
          console.error('supabase vendors error', error);
          setVendors([]);
          setErrorMsg(String(error.message ?? error));
        } else {
          setVendors((data as Vendor[]) ?? []);
        }
      } catch (err) {
        console.error('vendors fetch exception', err);
        setVendors([]);
        setErrorMsg('Failed to load vendors');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      setUserEmail(null);
    } catch (err) {
      console.error('signOut error', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Admin — Vendors</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">{userEmail ?? 'Not signed in'}</div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="mb-4">
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded"
            onClick={() => { /* open add-vendor modal or route */ }}
          >
            Add Vendor
          </button>
        </section>

        <section>
          {loading && <div className="text-sm text-gray-600">Loading vendors…</div>}
          {errorMsg && <div className="text-sm text-red-600 mb-2">{errorMsg}</div>}

          {!loading && vendors.length === 0 && (
            <div className="text-sm text-gray-500">No vendors found.</div>
          )}

          {!loading && vendors.length > 0 && (
            <ul className="space-y-2">
              {vendors.map((v) => (
                <li key={v.id ?? v.vendor_id} className="p-3 bg-white border rounded shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{v.name ?? v.vendor_name ?? 'Unnamed'}</div>
                      <div className="text-sm text-gray-600">
                        {v.station_code ? `${v.station_code} • ` : ''}{v.location ?? ''}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm ${v.is_active ? 'text-green-700' : 'text-red-600'}`}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
