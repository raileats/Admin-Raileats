"use client";

import React, { useEffect, useState } from "react";
import BasicInformationTab from "@/components/restro-edit/BasicInformationTab";

type StationOption = {
  label: string;
  value: string;
};

export default function RestroEditPageClient({
  initialData,
  stations,
  loadingStations,
}: {
  initialData: any;
  stations: StationOption[];
  loadingStations: boolean;
}) {
  const [local, setLocal] = useState<any>(initialData || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ---------------- Update field ---------------- */
  function updateField(key: string, value: any) {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  }

  /* ---------------- SAVE (SAFE JSON HANDLING) ---------------- */
  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/restrosmaster", {
        method: local?.RestroCode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
      });

      /* ✅ SAFE JSON PARSE (MAIN FIX) */
      let json: any = null;
      const text = await res.text();
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          console.warn("Non-JSON response:", text);
        }
      }

      if (!res.ok) {
        setError(json?.error || "Save failed");
        setSaving(false);
        return;
      }

      setSuccess("Saved successfully");

    } catch (err) {
      console.error("Save error:", err);
      setError("Unexpected error while saving");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded bg-red-50 border border-red-200 text-red-700 px-4 py-2">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded bg-green-50 border border-green-200 text-green-700 px-4 py-2">
          {success}
        </div>
      )}

      <BasicInformationTab
        local={local}
        updateField={updateField}
        stations={stations}
        loadingStations={loadingStations}
      />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded text-white ${
            saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
