// app/admin/restros/new/station-settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput } from "@/components/admin/AdminField";
import AdminPage from "@/components/admin/AdminPage";

export default function NewRestroStationSettingsPage() {
  const router = useRouter();
  const [restroCode, setRestroCode] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [stationName, setStationName] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRestroCode(localStorage.getItem("new_restro_code") || "");
    } catch {
      setRestroCode("");
    }
  }, []);

  async function saveAndContinue() {
    if (!restroCode) {
      setMsg("Missing RestroCode. Please create basic information first.");
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const payload = {
        StationCode: stationCode || null,
        StationName: stationName || null,
        State: stateName || null,
        City: city || null,
      };

      const res = await fetch(`/api/restros/${encodeURIComponent(restroCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Station settings save failed");
      }

      router.push(`/admin/restros/${encodeURIComponent(restroCode)}/edit/address-docs`);
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPage
      title="Add New Restro"
      subtitle="Add station details for the new restaurant outlet"
    >
      <AdminCard
        title="Station Settings"
        actions={
          <div className="flex gap-2">
            <AdminButton variant="secondary" onClick={() => router.back()}>
              Back
            </AdminButton>
            <AdminButton onClick={saveAndContinue} disabled={saving}>
              {saving ? "Saving..." : "Save & Continue"}
            </AdminButton>
          </div>
        }
      >
        <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          <AdminField label="Restro Code">
            <AdminInput value={restroCode} readOnly />
          </AdminField>

          <AdminField label="Station Code">
            <AdminInput
              value={stationCode}
              onChange={(event) => setStationCode(event.target.value.toUpperCase())}
              placeholder="BPL"
            />
          </AdminField>

          <AdminField label="Station Name">
            <AdminInput
              value={stationName}
              onChange={(event) => setStationName(event.target.value)}
              placeholder="Bhopal Jn"
            />
          </AdminField>

          <AdminField label="City">
            <AdminInput
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Bhopal"
            />
          </AdminField>

          <AdminField label="State">
            <AdminInput
              value={stateName}
              onChange={(event) => setStateName(event.target.value)}
              placeholder="Madhya Pradesh"
            />
          </AdminField>
        </div>

        {msg && (
          <div className="mt-4 text-sm font-semibold text-red-600">{msg}</div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
