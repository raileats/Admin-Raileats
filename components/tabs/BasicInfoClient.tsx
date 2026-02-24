"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialData: any;
  imagePrefix?: string;
};

export default function BasicInfoClient({
  initialData,
  imagePrefix = "",
}: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  /* ================= LOAD INITIAL ================= */

  useEffect(() => {
    if (!initialData) return;
    setLocal(initialData);
  }, [initialData]);

  /* ================= FIELD UPDATE ================= */

  function update(key: string, value: any) {
    setLocal((prev: any) => ({
      ...prev,
      [key]: value,
    }));
    setMsg(null);
    setErr(null);
  }

  /* ================= CLEAN PAYLOAD ================= */

  function buildPayload() {
    const payload: any = {
      RestroCode: Number(local.RestroCode),

      RestroName: local.RestroName || null,
      BrandNameifAny: local.BrandNameifAny || null,

      OwnerName: local.OwnerName || null,
      OwnerEmail: local.OwnerEmail || null,
      OwnerPhone: local.OwnerPhone
        ? Number(local.OwnerPhone)
        : null,

      RestroEmail: local.RestroEmail || null,
      RestroPhone: local.RestroPhone
        ? Number(local.RestroPhone)
        : null,

      StationCode: local.StationCode || null,
      StationName: local.StationName || null,

      IRCTCStatus: Number(local.IRCTCStatus || 0),
      RaileatsStatus: Number(local.RaileatsStatus || 0),
      IsIrctcApproved: String(local.IsIrctcApproved || "0"),

      RestroRating:
        local.RestroRating === ""
          ? null
          : Number(local.RestroRating),

      IsPureVeg: Number(local.IsPureVeg || 0),

      RestroDisplayPhoto: local.RestroDisplayPhoto || null,

      State: local.State || null,
    };

    // remove undefined only
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    return payload;
  }

  /* ================= SAVE ================= */

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

      console.log("Saving ID:", id);
      console.log("Payload:", payload);

      const res = await fetch(`/api/restros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      console.log("API Response:", json);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Save failed");
      }

      setMsg("Saved successfully ✅");

      // force fresh data reload
      router.refresh();
    } catch (e: any) {
      console.error("Save error:", e);
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /* ================= IMAGE HELPER ================= */

  const imgSrc = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    return imagePrefix + p;
  };

  /* ================= UI ================= */

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
            onChange={(e) =>
              update("RestroName", e.target.value)
            }
          />
        </Field>

        <Field label="Brand Name">
          <input
            value={local?.BrandNameifAny ?? ""}
            onChange={(e) =>
              update("BrandNameifAny", e.target.value)
            }
          />
        </Field>

        <Field label="Owner Name">
          <input
            value={local?.OwnerName ?? ""}
            onChange={(e) =>
              update("OwnerName", e.target.value)
            }
          />
        </Field>

        <Field label="Owner Email">
          <input
            value={local?.OwnerEmail ?? ""}
            onChange={(e) =>
              update("OwnerEmail", e.target.value)
            }
          />
        </Field>

        <Field label="Owner Phone">
          <input
            value={local?.OwnerPhone ?? ""}
            onChange={(e) =>
              update("OwnerPhone", e.target.value)
            }
          />
        </Field>

        <Field label="Restro Email">
          <input
            value={local?.RestroEmail ?? ""}
            onChange={(e) =>
              update("RestroEmail", e.target.value)
            }
          />
        </Field>

        <Field label="Restro Phone">
          <input
            value={local?.RestroPhone ?? ""}
            onChange={(e) =>
              update("RestroPhone", e.target.value)
            }
          />
        </Field>

        <Field label="Raileats Status">
          <select
            value={local?.RaileatsStatus ?? 0}
            onChange={(e) =>
              update("RaileatsStatus", Number(e.target.value))
            }
          >
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>
        </Field>

        <Field label="IRCTC Status">
          <select
            value={local?.IRCTCStatus ?? 0}
            onChange={(e) =>
              update("IRCTCStatus", Number(e.target.value))
            }
          >
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>
        </Field>

        <Field label="IRCTC Approved">
          <select
            value={local?.IsIrctcApproved ?? "0"}
            onChange={(e) =>
              update("IsIrctcApproved", e.target.value)
            }
          >
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </Field>

        <Field label="Restro Rating">
          <input
            type="number"
            value={local?.RestroRating ?? ""}
            onChange={(e) =>
              update("RestroRating", e.target.value)
            }
          />
        </Field>

        <Field label="Display Photo">
          <input
            value={local?.RestroDisplayPhoto ?? ""}
            onChange={(e) =>
              update("RestroDisplayPhoto", e.target.value)
            }
          />
        </Field>

        <Field label="Preview">
          {local?.RestroDisplayPhoto ? (
            <img
              src={imgSrc(local.RestroDisplayPhoto)}
              style={{ height: 80 }}
            />
          ) : (
            <div className="readonly">No image</div>
          )}
        </Field>
      </div>

      <div className="actions">
        <button onClick={() => router.back()}>
          Cancel
        </button>
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
      <label style={{ fontWeight: 600, fontSize: 13 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
