"use client";

import React, { useEffect, useState } from "react";
import BasicInformationTab from "./restro-edit/BasicInformationTab";

/* ================= TYPES ================= */

type StationOption = {
  label: string;
  value: string; // StationCode
};

type Restro = {
  RestroCode?: number;
  RestroName?: string;
  StationCode?: string;
  StationName?: string;
  State?: string;
  RaileatsStatus?: number;
  IsIrctcApproved?: boolean;
  RestroRating?: number;
  RestroDisplayPhoto?: string;
  OwnerName?: string;
  OwnerEmail?: string;
  OwnerPhone?: string;
  RestroEmail?: string;
  RestroPhone?: string;
};

/* ================= COMPONENT ================= */

export default function RestroEditPageClient({
  initialRestro,
}: {
  initialRestro: Restro;
}) {
  const [local, setLocal] = useState<Restro>(initialRestro || {});
  const [stations, setStations] = useState<StationOption[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);

  /* ---------- UPDATE FIELD ---------- */
  function updateField(key: keyof Restro, value: any) {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  /* ---------- LOAD STATIONS ---------- */
  useEffect(() => {
    let ignore = false;

    async function loadStations() {
      try {
        setLoadingStations(true);
        const res = await fetch("/api/stations");
        const json = await res.json();

        if (!ignore && Array.isArray(json)) {
          setStations(
            json.map((s: any) => ({
              value: s.StationCode,
              label: `${s.StationName} (${s.StationCode})${
                s.State ? ` - ${s.State}` : ""
              }`,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load stations", err);
      } finally {
        if (!ignore) setLoadingStations(false);
      }
    }

    loadStations();
    return () => {
      ignore = true;
    };
  }, []);

  /* ================= RENDER ================= */

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
