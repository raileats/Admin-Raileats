"use client";

import React, { useEffect, useState } from "react";
import BasicInformationTab from "./tabs/BasicInformationTab";
// import other tabs if needed

type StationOption = {
  label: string;
  value: string;
};

export default function RestroEditPageClient({
  initial,
}: {
  initial: any;
}) {
  const [local, setLocal] = useState<any>(initial ?? {});
  const [stations, setStations] = useState<StationOption[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);

  /* ---------------- UPDATE FIELD ---------------- */
  function updateField(key: string, value: any) {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  }

  /* ---------------- FETCH STATIONS ---------------- */
  useEffect(() => {
    let alive = true;

    async function loadStations() {
      try {
        setLoadingStations(true);

        const res = await fetch("/api/stations");
        const json = await res.json();

        if (!res.ok || !Array.isArray(json)) {
          console.error("Stations API failed", json);
          return;
        }

        const mapped: StationOption[] = json.map((s: any) => ({
          value: String(s.StationCode),
          label: `${s.StationName} (${s.StationCode})${s.State ? ` - ${s.State}` : ""}`,
        }));

        if (alive) setStations(mapped);
      } catch (err) {
        console.error("Stations fetch error", err);
      } finally {
        if (alive) setLoadingStations(false);
      }
    }

    loadStations();
    return () => {
      alive = false;
    };
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <div className="w-full">
      <BasicInformationTab
        local={local}
        updateField={updateField}
        stations={stations}              // ✅ ALWAYS ARRAY
        loadingStations={loadingStations} // ✅ PROPER FLAG
      />

      {/* other tabs below if needed */}
    </div>
  );
}
