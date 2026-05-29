// app/admin/restros/new/basic/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/AdminField";

export default function NewRestroBasicPage() {
  const router = useRouter();
  const [form, setForm] = useState<any>({ IsIrctcApproved: "No", RaileatsStatus: 0 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function updateField(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  async function saveAndNext() {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        StationCode: form.StationCode || null,
        StationName: form.StationName || null,
        State: form.State || null,
        RestroName: form.RestroName || null,
        BrandNameifAny: form.BrandNameifAny || null,
        OwnerName: form.OwnerName || null,
        OwnerEmail: form.OwnerEmail || null,
        OwnerPhone: form.OwnerPhone || null,
        RestroEmail: form.RestroEmail || null,
        RestroPhone: form.RestroPhone || null,
        IsIrctcApproved: form.IsIrctcApproved || "No",
        RaileatsStatus: Number(form.RaileatsStatus || 0),
        RestroRating: form.RestroRating || null,
        RestroDisplayPhoto: form.RestroDisplayPhoto || null,
      };

      const res = await fetch("/api/restros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Create failed");
      const row = data.row ?? data;
      const code = row?.RestroCode ?? row?.restro_code ?? row?.id;
      if (code) localStorage.setItem("new_restro_code", String(code));
      router.push("/admin/restros/new/station-settings");
    } catch (error: any) {
      setMsg(error?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard
      title="Basic Information"
      actions={<AdminButton onClick={saveAndNext} disabled={saving}>{saving ? "Saving..." : "Save & Next"}</AdminButton>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminField label="Station Code"><AdminInput value={form.StationCode ?? ""} onChange={(e) => updateField("StationCode", e.target.value.toUpperCase())} placeholder="BPL" /></AdminField>
        <AdminField label="Station Name"><AdminInput value={form.StationName ?? ""} onChange={(e) => updateField("StationName", e.target.value)} /></AdminField>
        <AdminField label="State"><AdminInput value={form.State ?? ""} onChange={(e) => updateField("State", e.target.value)} /></AdminField>
        <AdminField label="Restro Name"><AdminInput value={form.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} /></AdminField>
        <AdminField label="Brand Name"><AdminInput value={form.BrandNameifAny ?? ""} onChange={(e) => updateField("BrandNameifAny", e.target.value)} /></AdminField>
        <AdminField label="Raileats Status"><AdminSelect value={String(form.RaileatsStatus ?? 0)} onChange={(e) => updateField("RaileatsStatus", Number(e.target.value))}><option value="1">On</option><option value="0">Off</option></AdminSelect></AdminField>
        <AdminField label="IRCTC Approved"><AdminSelect value={form.IsIrctcApproved ?? "No"} onChange={(e) => updateField("IsIrctcApproved", e.target.value)}><option>Yes</option><option>No</option></AdminSelect></AdminField>
        <AdminField label="Restro Rating"><AdminInput value={form.RestroRating ?? ""} onChange={(e) => updateField("RestroRating", e.target.value)} /></AdminField>
        <AdminField label="Display Photo"><AdminInput value={form.RestroDisplayPhoto ?? ""} onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)} /></AdminField>
        <AdminField label="Owner Name"><AdminInput value={form.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} /></AdminField>
        <AdminField label="Owner Email"><AdminInput value={form.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} /></AdminField>
        <AdminField label="Owner Phone"><AdminInput value={form.OwnerPhone ?? ""} onChange={(e) => updateField("OwnerPhone", e.target.value)} /></AdminField>
        <AdminField label="Restro Email"><AdminInput value={form.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} /></AdminField>
        <AdminField label="Restro Phone"><AdminInput value={form.RestroPhone ?? ""} onChange={(e) => updateField("RestroPhone", e.target.value)} /></AdminField>
      </div>
      {msg ? <div className="mt-4 text-sm font-semibold text-red-600">{msg}</div> : null}
    </AdminCard>
  );
}
