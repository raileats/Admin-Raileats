'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // <-- use centralized client
import '../../app/globals.css';

export default function AdminPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // simple example: fetch vendors via a (public) RPC or table select
    // Replace the RPC name / query with whatever you need.
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('vendors') // or .rpc('your_rpc_name', { ... })
          .select('*')
          .limit(50);

        if (error) {
          console.error('supabase error', error);
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
      <ul className
