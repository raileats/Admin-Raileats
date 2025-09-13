// components/OutletsList.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function OutletsList({ trainNo }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!trainNo) return;
    (async () => {
      const { data, error } = await supabase
        .rpc('rpc_get_outlets_by_train', { p_train_no: trainNo });
      if (!error) setRows(data ?? []);
    })();
  }, [trainNo]);

  if (!trainNo) return <p>Select a train to view outlets</p>;
  if (rows.length === 0) return <p>No outlets available</p>;

  const grouped = rows.reduce((acc, r) => {
    acc[r.station_name] = acc[r.station_name] || [];
    acc[r.station_name].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([station, outlets]) => (
        <div key={station}>
          <h3 className="font-semibold text-lg">{station}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {outlets.map((o) => (
              <div key={o.outlet_id} className="border p-3 rounded shadow-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{o.outlet_name}</p>
                    <p className="text-sm text-gray-600">{(o.cuisines || []).join(', ')}</p>
                  </div>
                  <span className={o.open_now ? 'text-green-600' : 'text-red-600'}>
                    {o.open_now ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="text-sm mt-2">
                  ⭐ {o.rating ?? '-'} | Min ₹{o.min_order ?? '-'} 
                  {o.is_pure_veg && <span className="ml-2 bg-green-100 px-2 rounded text-xs">Pure Veg</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
