// components/RestroEditPageClient.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import RestroEditModal from "./RestroEditModal";

type Props = {
  restro: any | null;
};

export default function RestroEditPageClient({ restro }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState<any>(restro);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!restro) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Restro not found</h1>
        <p>Could not load the requested restro.</p>
      </div>
    );
  }

  // called by modal when user saves changes
  async function handleSave(updatedFields: any) {
    setSaving(true);
    setError(null);
    try {
      // call server API patch route: app/api/restros/[code]/route.ts (PATCH)
      const code = current.RestroCode ?? current.RestroId;
      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `Request failed ${res.status}`);
      }
      // json should contain updated row - update local state
      setCurrent(json.row ?? json); // depending on your API response shape
      // remain on page; also you might want to refresh list etc.
      // If you want to navigate back to list:
      // router.push("/admin/restros");
      return { ok: true, row: json.row ?? json };
    } catch (err: any) {
      setError(err?.message ?? String(err));
      return { ok: false, error: err?.message ?? String(err) };
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {error && (
        <div style={{ color: "red", padding: 12 }}>
          Error: {error}
        </div>
      )}
      <RestroEditModal
        restro={current}
        onClose={() => {
          // close => go back to list
          router.push("/admin/restros");
        }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
