// components/restro-route-tabs/RestroUserPasswordClient.tsx
"use client";

import React, { useState } from "react";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput } from "@/components/admin/AdminField";

type Props = {
  initialData?: any;
  restroCode?: string | number;
};

export default function RestroUserPasswordClient({ initialData = {}, restroCode }: Props) {
  const [form, setForm] = useState({
    RestroLoginMobile: initialData?.RestroLoginMobile ?? "",
    RestroPassword: initialData?.RestroPassword ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const code = String(restroCode ?? initialData?.RestroCode ?? "");

  async function save() {
    if (!code) {
      setMsg("Missing RestroCode. Please save Basic Information first.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/restros/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Save failed");
      if (json?.row) {
        setForm({
          RestroLoginMobile: json.row.RestroLoginMobile ?? "",
          RestroPassword: json.row.RestroPassword ?? "",
        });
      }
      setMsg("Saved successfully");
    } catch (error: any) {
      setMsg(error?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard
      title="Restro User & Password"
      subtitle="Manage restaurant login credentials"
      actions={<AdminButton onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</AdminButton>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminField label="Restro Login Mobile">
          <AdminInput
            inputMode="numeric"
            maxLength={10}
            value={form.RestroLoginMobile}
            onChange={(e) => setForm((prev) => ({ ...prev, RestroLoginMobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
            placeholder="Enter 10 digit mobile"
          />
        </AdminField>
        <AdminField label="Restro Password">
          <AdminInput
            type="text"
            value={form.RestroPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, RestroPassword: e.target.value }))}
            placeholder="Enter password"
          />
        </AdminField>
      </div>
      {msg ? <div className="mt-4 text-sm font-semibold text-blue-700">{msg}</div> : null}
    </AdminCard>
  );
}
