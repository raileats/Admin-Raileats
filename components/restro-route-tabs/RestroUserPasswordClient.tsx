// components/restro-route-tabs/RestroUserPasswordClient.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput } from "@/components/admin/AdminField";

type Props = {
  initialData?: any;
  restroCode?: string | number;
};

function cleanMobile(value: any) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

export default function RestroUserPasswordClient({
  initialData = {},
  restroCode,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    RestroUserName:
      initialData?.RestroUserName ??
      initialData?.RestroUsername ??
      initialData?.UserName ??
      "",
    RestroLoginMobile: cleanMobile(initialData?.RestroLoginMobile),
    RestroPassword: initialData?.RestroPassword ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const code = String(restroCode ?? initialData?.RestroCode ?? "");

  const canSave =
    String(form.RestroUserName ?? "").trim() !== "" &&
    cleanMobile(form.RestroLoginMobile).length === 10 &&
    String(form.RestroPassword ?? "").trim() !== "";

  async function save() {
    if (!code) {
      setMsg("Missing RestroCode. Please save Basic Information first.");
      return;
    }

    if (!canSave) {
      setMsg("Username, 10 digit mobile and password required hai.");
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/restros/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          RestroUserName: String(form.RestroUserName ?? "").trim(),
          RestroLoginMobile: cleanMobile(form.RestroLoginMobile),
          RestroPassword: String(form.RestroPassword ?? "").trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Save failed");
      }

      setMsg("Saved successfully");

      setTimeout(() => {
        router.push("/admin/restros/new/basic");
      }, 500);
    } catch (error: any) {
      console.error("SAVE ERROR:", error);
      setMsg(error?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard
      title="Restro User & Password"
      subtitle="Manage restaurant login credentials"
      actions={
        <button
          type="button"
          onClick={save}
          disabled={saving || !canSave}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            saving || !canSave
              ? "cursor-not-allowed bg-gray-300 text-gray-500 opacity-60"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminField label="Restro Username">
          <AdminInput
            value={form.RestroUserName}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                RestroUserName: e.target.value,
              }))
            }
            placeholder="Enter username"
          />
        </AdminField>

        <AdminField label="Restro Login Mobile">
          <AdminInput
            inputMode="numeric"
            maxLength={10}
            value={form.RestroLoginMobile}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                RestroLoginMobile: cleanMobile(e.target.value),
              }))
            }
            placeholder="Enter 10 digit mobile"
          />
        </AdminField>

        <AdminField label="Restro Password">
          <AdminInput
            type="text"
            value={form.RestroPassword}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                RestroPassword: e.target.value,
              }))
            }
            placeholder="Enter password"
          />
        </AdminField>
      </div>

      {msg ? (
        <div className="mt-4 text-sm font-semibold text-blue-700">
          {msg}
        </div>
      ) : null}
    </AdminCard>
  );
}
