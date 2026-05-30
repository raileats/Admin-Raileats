"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/AdminField";

type Props = {
  initialData: any;
  imagePrefix?: string;
};

function toStatusNumber(value: any) {
  const normalized = String(value ?? "").toLowerCase().trim();
  if (normalized === "1" || normalized === "true" || normalized === "on" || normalized === "active" || normalized === "yes") {
    return 1;
  }
  return 0;
}

function phoneDigits(value: any) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

function pickRestroPhone(row: any) {
  return phoneDigits(
    row?.RestroPhone ??
      row?.restroPhone ??
      row?.RestroMobile ??
      row?.RestaurantPhone ??
      row?.Phone ??
      ""
  );
}

function samePhone(a: any, b: any) {
  return phoneDigits(a) === phoneDigits(b);
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { ok: false, error: text || "Invalid server response" };
  }
}

export default function BasicInfoClient({
  initialData,
  imagePrefix = "",
}: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) return;
    setLocal({
      ...initialData,
      RaileatsStatus: toStatusNumber(initialData.RaileatsStatus),
      IRCTCStatus: toStatusNumber(initialData.IRCTCStatus),
    });
  }, [initialData]);

  useEffect(() => {
    const restroCode = initialData?.RestroCode;
    if (!restroCode) return;

    let cancelled = false;

    async function loadFreshRestro() {
      try {
        const res = await fetch(`/api/restros/${encodeURIComponent(String(restroCode))}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || json?.ok === false || !json?.row || cancelled) return;

        setLocal((prev: any) => ({
          ...prev,
          ...json.row,
          RaileatsStatus: toStatusNumber(json.row.RaileatsStatus),
          IRCTCStatus: toStatusNumber(json.row.IRCTCStatus),
        }));
      } catch (error) {
        console.error("Fresh restro load failed:", error);
      }
    }

    loadFreshRestro();

    return () => {
      cancelled = true;
    };
  }, [initialData?.RestroCode]);

  function update(key: string, value: any) {
    setLocal((prev: any) => ({
      ...prev,
      [key]: value,
    }));
    setMsg(null);
    setErr(null);
  }

  function buildPayload() {
    const raileatsStatus = toStatusNumber(local.RaileatsStatus);

    const restroPhone = pickRestroPhone(local);

    const payload: any = {
      RestroCode: Number(local.RestroCode),

      RestroName: local.RestroName || null,
      BrandNameifAny: local.BrandNameifAny || null,

      OwnerName: local.OwnerName || null,
      OwnerEmail: local.OwnerEmail || null,
      OwnerPhone: phoneDigits(local.OwnerPhone) || null,

      RestroEmail: local.RestroEmail || null,
      RestroPhone: restroPhone || null,

      StationCode: local.StationCode || null,
      StationName: local.StationName || null,

      IRCTCStatus: toStatusNumber(local.IRCTCStatus),
      RaileatsStatus: raileatsStatus,
      raileatsStatus,
      IsIrctcApproved: String(local.IsIrctcApproved || "0"),

      RestroRating: local.RestroRating === "" ? null : Number(local.RestroRating),
      IsPureVeg: toStatusNumber(local.IsPureVeg),
      RestroDisplayPhoto: local.RestroDisplayPhoto || null,
      State: local.State || null,
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    return payload;
  }

  async function save() {
    try {
      setSaving(true);
      setMsg(null);
      setErr(null);

      if (!local?.RestroCode) {
        throw new Error("Invalid RestroCode");
      }

      const id = Number(local.RestroCode);
      const payload = buildPayload();
      const raileatsStatus = toStatusNumber(local.RaileatsStatus);
      const expectedRestroPhone = payload.RestroPhone || "";

      const res = await fetch(`/api/restros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json = await readJson(res);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Save failed");
      }

      let savedRow = json?.row || {};

      if (expectedRestroPhone && !samePhone(savedRow?.RestroPhone, expectedRestroPhone)) {
        const fallbackRes = await fetch("/api/restrosmaster", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            RestroCode: id,
            RestroPhone: expectedRestroPhone,
          }),
        });

        const fallbackJson = await readJson(fallbackRes);

        if (!fallbackRes.ok || fallbackJson?.ok === false || fallbackJson?.error) {
          throw new Error(fallbackJson?.error || "Restro Phone direct save failed");
        }

        savedRow = fallbackJson?.row || fallbackJson || savedRow;
      }

      const freshRes = await fetch(`/api/restros/${id}?t=${Date.now()}`, {
        cache: "no-store",
      });
      const freshJson = await readJson(freshRes);

      if (freshRes.ok && freshJson?.ok !== false && freshJson?.row) {
        savedRow = freshJson.row;
      }

      if (expectedRestroPhone && !samePhone(savedRow?.RestroPhone, expectedRestroPhone)) {
        throw new Error(
          `Restro Phone save verify failed. Expected ${expectedRestroPhone}, got ${
            savedRow?.RestroPhone || "blank"
          }`
        );
      }

      setLocal((prev: any) => ({
        ...prev,
        ...savedRow,
        RestroPhone:
          pickRestroPhone(savedRow) ||
          payload.RestroPhone ||
          pickRestroPhone(prev),
        RaileatsStatus: raileatsStatus,
        RestroDisplayPhoto:
          savedRow.RestroDisplayPhoto ?? payload.RestroDisplayPhoto ?? prev.RestroDisplayPhoto,
      }));
      setMsg("Saved successfully");
    } catch (e: any) {
      console.error("Save error:", e);
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const imgSrc = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    return imagePrefix + p;
  };

  return (
    <AdminCard
      title="Basic Information"
      actions={
        <div className="flex gap-2">
          <AdminButton variant="secondary" onClick={() => router.back()}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </AdminButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminField label="Restro Code">
          <div className="flex h-10 items-center rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-700">
            {local?.RestroCode ?? "-"}
          </div>
        </AdminField>

        <AdminField label="Restro Name">
          <AdminInput
            value={local?.RestroName ?? ""}
            onChange={(e) => update("RestroName", e.target.value)}
          />
        </AdminField>

        <AdminField label="Brand Name">
          <AdminInput
            value={local?.BrandNameifAny ?? ""}
            onChange={(e) => update("BrandNameifAny", e.target.value)}
          />
        </AdminField>

        <AdminField label="Owner Name">
          <AdminInput
            value={local?.OwnerName ?? ""}
            onChange={(e) => update("OwnerName", e.target.value)}
          />
        </AdminField>

        <AdminField label="Owner Email">
          <AdminInput
            value={local?.OwnerEmail ?? ""}
            onChange={(e) => update("OwnerEmail", e.target.value)}
          />
        </AdminField>

        <AdminField label="Owner Phone">
          <AdminInput
            inputMode="numeric"
            maxLength={10}
            value={phoneDigits(local?.OwnerPhone)}
            onChange={(e) => update("OwnerPhone", phoneDigits(e.target.value))}
          />
        </AdminField>

        <AdminField label="Restro Email">
          <AdminInput
            value={local?.RestroEmail ?? ""}
            onChange={(e) => update("RestroEmail", e.target.value)}
          />
        </AdminField>

        <AdminField label="Restro Phone">
          <AdminInput
            inputMode="numeric"
            maxLength={10}
            value={pickRestroPhone(local)}
            onChange={(e) => update("RestroPhone", phoneDigits(e.target.value))}
          />
        </AdminField>

        <AdminField label="Raileats Status">
          <AdminSelect
            value={toStatusNumber(local?.RaileatsStatus)}
            onChange={(e) => update("RaileatsStatus", Number(e.target.value))}
          >
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="IRCTC Status">
          <AdminSelect
            value={toStatusNumber(local?.IRCTCStatus)}
            onChange={(e) => update("IRCTCStatus", Number(e.target.value))}
          >
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="IRCTC Approved">
          <AdminSelect
            value={local?.IsIrctcApproved ?? "0"}
            onChange={(e) => update("IsIrctcApproved", e.target.value)}
          >
            <option value="1">Yes</option>
            <option value="0">No</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="Restro Rating">
          <AdminInput
            type="number"
            value={local?.RestroRating ?? ""}
            onChange={(e) => update("RestroRating", e.target.value)}
          />
        </AdminField>

        <AdminField label="Pure Veg">
          <AdminSelect
            value={toStatusNumber(local?.IsPureVeg)}
            onChange={(e) => update("IsPureVeg", Number(e.target.value))}
          >
            <option value={1}>Yes</option>
            <option value={0}>No</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="Display Photo">
          <AdminInput
            value={local?.RestroDisplayPhoto ?? ""}
            onChange={(e) => update("RestroDisplayPhoto", e.target.value)}
          />
        </AdminField>

        <AdminField label="Preview">
          {local?.RestroDisplayPhoto ? (
            <img
              src={imgSrc(local.RestroDisplayPhoto)}
              className="h-20 rounded-md border border-slate-200 object-cover"
              alt="Restro display preview"
            />
          ) : (
            <div className="flex h-20 items-center rounded-md bg-slate-100 px-3 text-sm text-slate-500">
              No image
            </div>
          )}
        </AdminField>
      </div>

      {(msg || err) && (
        <div className="mt-4">
          {msg && <div className="text-sm font-semibold text-green-700">{msg}</div>}
          {err && <div className="text-sm font-semibold text-red-700">{err}</div>}
        </div>
      )}
    </AdminCard>
  );
}
