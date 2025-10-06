// components/restro-edit/ContactsTab.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  local?: any; // local object passed from parent
  updateField?: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
  restroCode?: string; // canonical restroCode passed by parent
};

export default function ContactsTab({ local = {}, updateField = () => {}, restroCode = "" }: Props) {
  // Map the RestroMaster style columns into arrays we will edit
  const [emails, setEmails] = useState<
    { name: string; receiving: string; status: string }[]
  >([]);
  const [whatsapps, setWhatsapps] = useState<
    { name: string; number: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: derive arrays from the provided local/restro object (works for both local and restro)
  function deriveFromLocal(l: any) {
    const e: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const nameKey = `EmailAddressName${i}`;
      const recvKey = `EmailsforOrdersReceiving${i}`;
      const statusKey = `EmailsforOrdersStatus${i}`;
      if (l[nameKey] || l[recvKey] || l[statusKey]) {
        e.push({
          name: l[nameKey] ?? "",
          receiving: l[recvKey] ?? "",
          status: l[statusKey] ?? "",
        });
      }
    }
    // ensure at least 2 rows (so UI isn't empty)
    while (e.length < 2) e.push({ name: "", receiving: "", status: "" });

    const w: any[] = [];
    for (let i = 1; i <= 5; i++) {
      const nameKey = `WhatsappMobileNumberName${i}`;
      const numKey = `WhatsappMobileNumberforOrderDetails${i}`;
      const statusKey = `WhatsappMobileNumberStatus${i}`;
      if (l[nameKey] || l[numKey] || l[statusKey]) {
        w.push({
          name: l[nameKey] ?? "",
          number: l[numKey] ?? "",
          status: l[statusKey] ?? "",
        });
      }
    }
    // ensure at least 2 rows
    while (w.length < 2) w.push({ name: "", number: "", status: "" });

    return { e, w };
  }

  useEffect(() => {
    const { e, w } = deriveFromLocal(local ?? {});
    setEmails(e);
    setWhatsapps(w);
  }, [local]);

  async function handleSave() {
    setLoading(true);
    setError(null);

    // Build payload with exact RestroMaster column names
    const payload: any = {};

    // emails
    for (let i = 0; i < Math.max(2, emails.length); i++) {
      const idx = i + 1;
      payload[`EmailAddressName${idx}`] = emails[i]?.name ?? "";
      payload[`EmailsforOrdersReceiving${idx}`] = emails[i]?.receiving ?? "";
      payload[`EmailsforOrdersStatus${idx}`] = emails[i]?.status ?? "";
    }

    // whatsapps (support up to 5 as your columns showed)
    for (let i = 0; i < Math.max(2, whatsapps.length); i++) {
      const idx = i + 1;
      payload[`WhatsappMobileNumberName${idx}`] = whatsapps[i]?.name ?? "";
      payload[`WhatsappMobileNumberforOrderDetails${idx}`] = whatsapps[i]?.number ?? "";
      payload[`WhatsappMobileNumberStatus${idx}`] = whatsapps[i]?.status ?? "";
    }

    // patch the restro row
    const code = restroCode || local?.RestroCode || local?.restro_code || local?.code || "";

    if (!code) {
      setError("Missing restroCode, cannot save contacts.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Save failed (${res.status})`);
      }
      // optional: you might re-fetch parent restro or call parent's updateField - we will call updateField for a few keys
      try {
        if (updateField) {
          // update parent "local" for primary keys so UI outside modal updates if needed
          updateField("EmailsforOrdersReceiving1", payload["EmailsforOrdersReceiving1"]);
          updateField("WhatsappMobileNumberforOrderDetails1", payload["WhatsappMobileNumberforOrderDetails1"]);
        }
      } catch {}
      alert("Contacts saved");
    } catch (err: any) {
      console.error("save contacts failed", err);
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  // small helper update functions
  function updateEmailRow(i: number, k: keyof (typeof emails)[number], v: string) {
    setEmails((prev) => {
      const copy = prev.slice();
      copy[i] = { ...copy[i], [k]: v };
      return copy;
    });
  }

  function updateWhatsappRow(i: number, k: keyof (typeof whatsapps)[number], v: string) {
    setWhatsapps((prev) => {
      const copy = prev.slice();
      copy[i] = { ...copy[i], [k]: v };
      return copy;
    });
  }

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ marginTop: 0 }}>Contacts</h3>
      <p style={{ color: "#666", marginBottom: 8 }}>Edit email addresses and WhatsApp numbers stored on the RestroMaster row. Click Save to persist.</p>

      {error && <div style={{ color: "red", marginBottom: 12 }}>Failed to load contacts — {String(error)}</div>}

      <div style={{ maxWidth: 1100 }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Emails</div>
        {emails.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px", gap: 12, marginBottom: 8 }}>
            <input placeholder={`Name ${i + 1}`} value={r.name} onChange={(e) => updateEmailRow(i, "name", e.target.value)} />
            <input placeholder={`Email ${i + 1}`} value={r.receiving} onChange={(e) => updateEmailRow(i, "receiving", e.target.value)} />
            <input placeholder="Status" value={r.status} onChange={(e) => updateEmailRow(i, "status", e.target.value)} />
          </div>
        ))}

        <div style={{ height: 12 }} />

        <div style={{ marginBottom: 8, fontWeight: 600 }}>WhatsApp numbers</div>
        {whatsapps.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px", gap: 12, marginBottom: 8 }}>
            <input placeholder={`Name ${i + 1}`} value={r.name} onChange={(e) => updateWhatsappRow(i, "name", e.target.value)} />
            <input placeholder={`Mobile ${i + 1}`} value={r.number} onChange={(e) => updateWhatsappRow(i, "number", e.target.value)} />
            <input placeholder="Status" value={r.status} onChange={(e) => updateWhatsappRow(i, "status", e.target.value)} />
          </div>
        ))}

        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={loading} style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: "#0ea5e9", color: "#fff" }}>
            {loading ? "Saving..." : "Save"}
          </button>

          <button onClick={() => {
            // reset from parent local
            const { e, w } = ((): any => {
              const L = local ?? {};
              const outE: any[] = [];
              for (let ii = 1; ii <= 3; ii++) {
                outE.push({
                  name: L[`EmailAddressName${ii}`] ?? "",
                  receiving: L[`EmailsforOrdersReceiving${ii}`] ?? "",
                  status: L[`EmailsforOrdersStatus${ii}`] ?? "",
                });
              }
              const outW: any[] = [];
              for (let ii = 1; ii <= 5; ii++) {
                outW.push({
                  name: L[`WhatsappMobileNumberName${ii}`] ?? "",
                  number: L[`WhatsappMobileNumberforOrderDetails${ii}`] ?? "",
                  status: L[`WhatsappMobileNumberStatus${ii}`] ?? "",
                });
              }
              return { e: outE, w: outW };
            })();
            setEmails(e);
            setWhatsapps(w);
          }} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}>
            Reset
          </button>
        </div>
      </div>

      <style jsx>{`
        input {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          box-sizing: border-box;
        }
        @media (max-width: 720px) {
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
