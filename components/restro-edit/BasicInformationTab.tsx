"use client";

import React, { useEffect, useState } from "react";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  Select: any;
  Toggle: any;
};

export default function BasicInformationTab({
  local,
  updateField,
  Select,
  Toggle,
}: Props) {
  const [q, setQ] = useState("");
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= STATION SEARCH ================= */
  useEffect(() => {
    if (!q || q.length < 2) {
      setStations([]);
      return;
    }

    let active = true;
    setLoading(true);

    fetch(`/api/stations/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((j) => {
        if (active) setStations(Array.isArray(j?.rows) ? j.rows : []);
      })
      .catch(() => {
        if (active) setStations([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [q]);

  /* ================= SELECT STATION ================= */
  function selectStation(st: any) {
    updateField("StationName", st.station_name);
    updateField("StationCode", st.station_code);
    updateField("State", st.state);
    updateField("station_id", st.id);
    setQ(`${st.station_name} (${st.station_code})`);
    setStations([]);
  }

  return (
    <div className="space-y-8">
      {/* ================= RESTAURANT DETAILS ================= */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-500">
          RESTAURANT DETAILS
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {/* ===== Station Search ===== */}
          <div className="col-span-1 relative">
            <label className="mb-1 block text-sm font-medium">
              Station <span className="text-red-500">*</span>
            </label>

            <input
              value={q || local.StationName || ""}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search station name or code"
              className="w-full rounded-md border px-3 py-2"
            />

            {loading && (
              <div className="absolute z-10 mt-1 w-full rounded border bg-white px-3 py-2 text-sm">
                Searching…
              </div>
            )}

            {stations.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow">
                {stations.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => selectStation(st)}
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100"
                  >
                    <div className="font-medium">
                      {st.station_name} ({st.station_code})
                    </div>
                    <div className="text-xs text-slate-500">
                      {st.state}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== Restro Code ===== */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Restro Code
            </label>
            <input
              disabled
              value={local.RestroCode || "Auto Generated"}
              className="w-full rounded-md border bg-slate-50 px-3 py-2"
            />
          </div>

          {/* ===== Restro Name ===== */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Restro Name <span className="text-red-500">*</span>
            </label>
            <input
              value={local.RestroName || ""}
              onChange={(e) => updateField("RestroName", e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        {/* Brand Name */}
        <div className="mt-4 w-1/3">
          <label className="mb-1 block text-sm font-medium">
            Brand Name
          </label>
          <input
            value={local.BrandName || ""}
            onChange={(e) => updateField("BrandName", e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </section>

      {/* ================= STATUS & APPROVAL ================= */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-500">
          STATUS & APPROVAL
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Raileats Status
            </label>
            <Toggle
              checked={!!local.RaileatsStatus}
              onChange={(v: boolean) => updateField("RaileatsStatus", v)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              IRCTC Approved
            </label>
            <Select
              value={local.IsIrctcApproved ? "Yes" : "No"}
              onChange={(v: string) =>
                updateField("IsIrctcApproved", v === "Yes" ? 1 : 0)
              }
              options={["Yes", "No"]}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Restro Rating
            </label>
            <input
              value={local.RestroRating || ""}
              onChange={(e) =>
                updateField("RestroRating", e.target.value)
              }
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
