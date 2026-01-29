"use client";

import React, { useEffect, useState } from "react";
import BasicInformationTab from "./admin/tabs/BasicInformationTab";

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

  function updateField(key: string, value: any) {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    let alive = true;

    async function loadStations() {
      try {
        setLoadingStations(true);
        const res = await fetch("/api/stations");
        const json = await res.json();

        if (!res.ok || !Array.isArray(json)) return;

        const mapped = json.map((s: any) => ({
          value: String(s.StationCode),
          label: `${s.StationName} (${s.StationCode})${
            s.State ? ` - ${s.State}` : ""
          }`,
        }));

        if (alive) setStations(mapped);
      } catch (e) {
        console.error("Stations fetch error", e);
      } finally {
        if (alive) setLoadingStations(false);
      }
    }

    loadStations();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="w-full">
      <BasicInformationTab
        local={local}
        updateField={updateField}
        stations={stations}
        loadingStations={loadingStations}
      />
    </div>
  );
}
