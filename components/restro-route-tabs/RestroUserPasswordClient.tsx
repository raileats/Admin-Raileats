// components/restro-route-tabs/RestroUserPasswordClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput } from "@/components/admin/AdminField";

type Props = {
  initialData?: any;
  restroCode?: string | number;
};

const INDIAN_MOBILE_RE = /^[6-9][0-9]{9}$/;

function cleanMobile(value: any) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

export default function RestroUserPasswordClient({
  initialData = {},
  restroCode,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

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

  const canSave = useMemo(() => {
    return (
      String(form.RestroUserName ?? "").trim() &&
      INDIAN_MOBILE_RE.test(cleanMobile(form.RestroLoginMobile)) &&
      String(form.RestroPassword ?? "").trim()
    );
  }, [form]);

  async function save() {
    if (!code) {
      setMsg("Missing RestroCode. Please save Basic Information first.");
      return;
    }

    if (!canSave) {
      setMsg("Please fill username, valid 10 digit mobile and password.");
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

      if (json?.row) {
        setForm({
          RestroUserName:
            json.row.RestroUserName ??
            json.row.RestroUsername ??
            json.row.UserName ??
            form.RestroUserName ??
            "",
          RestroLoginMobile: cleanMobile(json.row.RestroLoginMobile),
          RestroPassword: json.row.RestroPassword ?? "",
        });
      }

      setMsg("Saved successfully");

      setTimeout(() => {
        if (pathname?.includes("/admin/restros/new/")) {
          router.push("/admin/restros/new/basic");
        } else {
          router.push(`/admin/restros/${encodeURIComponent(code)}/edit`);
        }
      }, 500);
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
      actions={
        <AdminButton onClick={save} disabled={saving || !canSave}>
          {saving ? "Saving..." : "Save"}
        </AdminButton>
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
            className={
              form.RestroLoginMobile &&
              INDIAN_MOBILE_RE.test(cleanMobile(form.RestroLoginMobile))
                ? "border-emerald-400"
                : form.RestroLoginMobile
                ? "border-red-400"
                : ""
            }
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
