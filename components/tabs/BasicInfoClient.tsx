"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  initialData: any;
  imagePrefix?: string;
};

function toStatusNumber(value: any) {
  const normalized = String(value ?? "").toLowerCase().trim();
  if (normalized === "1" || normalized === "true" || normalized === "on" || normalized === "active") {
    return 1;
  }
  return 0;
}

export default function BasicInfoClient({
  initialData,
  imagePrefix = "",
}: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({});
  const [raileatsStatus, setRaileatsStatus] = useState(0);
  const [pendingRaileatsStatus, setPendingRaileatsStatus] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) return;
    const normalizedRaileatsStatus = toStatusNumber(initialData.RaileatsStatus);

    setLocal({
      ...initialData,
      RaileatsStatus: normalizedRaileatsStatus,
      IRCTCStatus: toStatusNumber(initialData.IRCTCStatus),
    });
    setRaileatsStatus(normalizedRaileatsStatus);
    setPendingRaileatsStatus(normalizedRaileatsStatus);
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
    const payload: any = {
      RestroCode: Number(local.RestroCode),

      RestroName: local.RestroName || null,
      BrandNameifAny: local.BrandNameifAny || null,

      OwnerName: local.OwnerName || null,
      OwnerEmail: local.OwnerEmail || null,
      OwnerPhone: local.OwnerPhone ? Number(local.OwnerPhone) : null,

      RestroEmail: local.RestroEmail || null,
      RestroPhone: local.RestroPhone ? Number(local.RestroPhone) : null,

      StationCode: local.StationCode || null,
      StationName: local.StationName || null,

      IRCTCStatus: toStatusNumber(local.IRCTCStatus),
      RaileatsStatus: pendingRaileatsStatus,
      raileatsStatus: pendingRaileatsStatus,
      IsIrctcApproved: String(local.IsIrctcApproved || "0"),

      RestroRating: local.RestroRating === "" ? null : Number(local.RestroRating),
      IsPureVeg: Number(local.IsPureVeg || 0),
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
      const statusToSave = pendingRaileatsStatus;

      const res = await fetch(`/api/restros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Save failed");
      }

      const statusRes = await fetch(`/api/admin/restros/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RaileatsStatus: statusToSave }),
      });

      if (!statusRes.ok) {
        const statusJson = await statusRes.json().catch(() => null);
        throw new Error(statusJson?.error || "Basic info saved, but RailEats status update failed");
      }

      const { data: verifiedRow, error: verifyError } = await supabase
        .from("RestroMaster")
        .select("*")
        .eq("RestroCode", id)
        .maybeSingle();

      if (verifyError) {
        throw new Error(`RailEats status saved but verify failed: ${verifyError.message}`);
      }

      if (toStatusNumber(verifiedRow?.RaileatsStatus) !== statusToSave) {
        throw new Error(
          "RailEats status API returned success, but Supabase value did not change. Please fix /api/admin/restros/[code]/status route to update RestroMaster.RaileatsStatus."
        );
      }

      setLocal({
        ...verifiedRow,
        RaileatsStatus: toStatusNumber(verifiedRow.RaileatsStatus),
        IRCTCStatus: toStatusNumber(verifiedRow.IRCTCStatus),
      });
      setRaileatsStatus(toStatusNumber(verifiedRow.RaileatsStatus));
      setPendingRaileatsStatus(toStatusNumber(verifiedRow.RaileatsStatus));
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
    <div style={{ padding: 18 }}>
      <h3 style={{ textAlign: "center", marginBottom: 18 }}>
        Basic Information
      </h3>

      <div className="grid">
        <Field label="Restro Code">
          <div className="readonly">{local?.RestroCode ?? "-"}</div>
        </Field>

        <Field label="Restro Name">
          <input
            value={local?.RestroName ?? ""}
            onChange={(e) => update("RestroName", e.target.value)}
          />
        </Field>

        <Field label="Brand Name">
          <input
            value={local?.BrandNameifAny ?? ""}
            onChange={(e) => update("BrandNameifAny", e.target.value)}
          />
        </Field>

        <Field label="Owner Name">
          <input
            value={local?.OwnerName ?? ""}
            onChange={(e) => update("OwnerName", e.target.value)}
          />
        </Field>

        <Field label="Owner Email">
          <input
            value={local?.OwnerEmail ?? ""}
            onChange={(e) => update("OwnerEmail", e.target.value)}
          />
        </Field>

        <Field label="Owner Phone">
          <input
            value={local?.OwnerPhone ?? ""}
            onChange={(e) => update("OwnerPhone", e.target.value)}
          />
        </Field>

        <Field label="Restro Email">
          <input
            value={local?.RestroEmail ?? ""}
            onChange={(e) => update("RestroEmail", e.target.value)}
          />
        </Field>

        <Field label="Restro Phone">
          <input
            value={local?.RestroPhone ?? ""}
            onChange={(e) => update("RestroPhone", e.target.value)}
          />
        </Field>

        <Field label="Raileats Status">
          <button
            type="button"
            onClick={() => {
              const next = pendingRaileatsStatus === 1 ? 0 : 1;
              setPendingRaileatsStatus(next);
              update("RaileatsStatus", next);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: 0,
              background: "transparent",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 50,
                height: 26,
                borderRadius: 999,
                background: raileatsStatus === 1 ? "#06b6d4" : "#9ca3af",
                position: "relative",
                display: "inline-block",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: raileatsStatus === 1 ? 27 : 3,
                  transition: "left 0.2s ease",
                }}
              />
            </span>
            <span>{raileatsStatus === 1 ? "On" : "Off"}</span>
            {pendingRaileatsStatus !== raileatsStatus && (
              <span style={{ color: "#2563eb", fontSize: 12, fontWeight: 600 }}>
                Save pending: {pendingRaileatsStatus === 1 ? "On" : "Off"}
              </span>
            )}
          </button>
        </Field>

        <Field label="IRCTC Status">
          <select
            value={toStatusNumber(local?.IRCTCStatus)}
            onChange={(e) => update("IRCTCStatus", Number(e.target.value))}
          >
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>
        </Field>

        <Field label="IRCTC Approved">
          <select
            value={local?.IsIrctcApproved ?? "0"}
            onChange={(e) => update("IsIrctcApproved", e.target.value)}
          >
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </Field>

        <Field label="Restro Rating">
          <input
            type="number"
            value={local?.RestroRating ?? ""}
            onChange={(e) => update("RestroRating", e.target.value)}
          />
        </Field>

        <Field label="Display Photo">
          <input
            value={local?.RestroDisplayPhoto ?? ""}
            onChange={(e) => update("RestroDisplayPhoto", e.target.value)}
          />
        </Field>

        <Field label="Preview">
          {local?.RestroDisplayPhoto ? (
            <img
              src={imgSrc(local.RestroDisplayPhoto)}
              style={{ height: 80 }}
              alt="Restro display preview"
            />
          ) : (
            <div className="readonly">No image</div>
          )}
        </Field>
      </div>

      <div className="actions">
        <button onClick={() => router.back()}>Cancel</button>
        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {msg && <div style={{ color: "green" }}>{msg}</div>}
      {err && <div style={{ color: "red" }}>{err}</div>}

      <style jsx>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .readonly {
          padding: 8px;
          background: #f5f5f5;
        }
        input,
        select {
          width: 100%;
          padding: 8px;
        }
        .actions {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label style={{ fontWeight: 600, fontSize: 13 }}>{label}</label>
      {children}
    </div>
  );
}
