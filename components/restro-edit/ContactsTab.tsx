// components/restro-edit/ContactsTab.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  local?: any;
  updateField?: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
  restroCode?: string; // important
};

export default function ContactsTab({ restroCode, local, updateField }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [whatsapps, setWhatsapps] = useState<any[]>([]);

  useEffect(() => {
    if (!restroCode || String(restroCode).trim() === "") {
      setError("Missing restroCode");
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/restros/${encodeURIComponent(String(restroCode))}/contacts`, { method: "GET" })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Fetch failed (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (json?.ok === false && json?.error) {
          throw new Error(json.error);
        }
        setEmails(Array.isArray(json.emails) ? json.emails : []);
        setWhatsapps(Array.isArray(json.whatsapps) ? json.whatsapps : []);
      })
      .catch((err) => {
        console.error("Contacts fetch error:", err);
        setError(`Failed to load contacts — ${err?.message ?? String(err)}`);
        setEmails([]);
        setWhatsapps([]);
      })
      .finally(() => setLoading(false));
  }, [restroCode]);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Contacts</h3>

      {loading && <div>Loading contacts…</div>}

      {!loading && error && <div style={{ color: "red" }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <h4>Emails</h4>
            {emails.length === 0 && <div style={{ color: "#666" }}>No emails configured</div>}
            {emails.map((e: any) => (
              <div key={e.id ?? `${e.RestroCode}-email-${Math.random()}`} style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ fontWeight: 600 }}>{e.Name ?? "—"}</div>
                <div><a href={`mailto:${e.Email}`}>{e.Email}</a></div>
                <div style={{ color: "#666", fontSize: 12 }}>{e.Active ? "Active" : "Inactive"}</div>
              </div>
            ))}
          </div>

          <div>
            <h4>WhatsApp / Mobile</h4>
            {whatsapps.length === 0 && <div style={{ color: "#666" }}>No WhatsApp numbers configured</div>}
            {whatsapps.map((w: any) => (
              <div key={w.id ?? `${w.RestroCode}-wa-${Math.random()}`} style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ fontWeight: 600 }}>{w.Name ?? "—"}</div>
                <div>{w.Mobile}</div>
                <div style={{ color: "#666", fontSize: 12 }}>{w.Active ? "Active" : "Inactive"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
