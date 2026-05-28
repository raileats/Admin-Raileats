// app/admin/restros/new/basic/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput } from "@/components/admin/AdminField";
import AdminPage from "@/components/admin/AdminPage";

export default function BasicPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveAndNext() {
    setSaving(true);
    setMsg(null);

    try {
      const body = {
        RestroName: name,
        BrandName: brand,
        RestroEmail: email,
      };

      const res = await fetch("/api/restros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg("Create failed: " + (data?.error ?? "unknown"));
        setSaving(false);
        return;
      }

      const row = data.row ?? data;
      const code = row?.RestroCode ?? row?.restro_code ?? row?.id ?? null;
      if (code) localStorage.setItem("new_restro_code", String(code));
      router.push("/admin/restros/new/station-settings");
    } catch (err: any) {
      console.error(err);
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPage
      title="Add New Restro"
      subtitle="Create the basic restaurant profile before station setup"
    >
      <AdminCard
        title="Basic Information"
        actions={
          <div className="flex gap-2">
            <AdminButton variant="secondary" onClick={() => window.history.back()}>
              Cancel
            </AdminButton>
            <AdminButton onClick={saveAndNext} disabled={saving}>
              {saving ? "Saving..." : "Save & Next"}
            </AdminButton>
          </div>
        }
      >
        <div className="grid max-w-3xl grid-cols-1 gap-4">
          <AdminField label="Restaurant Name">
            <AdminInput
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </AdminField>

          <AdminField label="Brand Name">
            <AdminInput
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            />
          </AdminField>

          <AdminField label="Contact Email">
            <AdminInput
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
