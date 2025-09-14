// components/OutletsList.tsx
'use client';

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/db";
type Outlet = {
  id?: string | number;
  name?: string;
  restaurant_name?: string;
  is_open?: boolean;
  open_time?: string | null;
  close_time?: string | null;
  rating?: number | null;
  min_order_value?: number | null;
  pureveg?: boolean | null;
  cuisines?: string | null;
};

export default function OutletsList({ trainNo }: { trainNo: string | null }) {
  const [loading, setLoading] = useState(false);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!trainNo) {
      setOutlets([]);
      return;
    }
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // CHANGE TABLE/COLUMNS as per your DB schema
        const { data, error } = await supabase
          .from('outlets')
          .select('id,name,restaurant_name,is_open,open_time,close_time,rating,min_order_value,pureveg,cuisines')
          .ilike('train_no', `${trainNo}%`)
          .order('rating', { ascending: false })
          .limit(50);

        if (error) {
          setErrorMsg(error.message);
          setOutlets([]);
        } else {
          setOutlets((data as Outlet[]) ?? []);
        }
      } catch (e) {
        setErrorMsg('Failed to load outlets');
        setOutlets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [trainNo]);

  if (!trainNo) return <div className="text-sm text-gray-600">Select a train to see outlets.</div>;

  return (
    <div>
      {loading && <div className="text-sm">Loading outlets…</div>}
      {errorMsg && <div className="text-sm text-red-600 mb-2">{errorMsg}</div>}
      {!loading && outlets.length === 0 && <div className="text-sm text-gray-500">No outlets found for this train.</div>}
      <ul className="space-y-3">
        {outlets.map((o) => (
          <li key={String(o.id ?? o.name)} className="p-3 bg-white border rounded shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-semibold">{o.name ?? o.restaurant_name ?? 'Outlet'}</div>
                <div className="text-xs text-gray-600">{o.pureveg ? 'Pure Veg' : 'Veg/Non-Veg'} • {o.cuisines ?? '–'}</div>
                <div className="text-xs text-gray-600">Min Order: ₹{o.min_order_value ?? '—'} • Rating: {o.rating ?? '—'}</div>
              </div>
              <div className="text-right text-xs">
                <div className={o.is_open ? 'text-green-700' : 'text-red-600'}>{o.is_open ? 'Open' : 'Closed'}</div>
                <div className="text-gray-500">{o.open_time ?? '--'} – {o.close_time ?? '--'}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
