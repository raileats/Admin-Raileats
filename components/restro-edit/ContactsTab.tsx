// path: components/restro-edit/ContactsTab.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  local?: any;
  updateField?: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
  restroCode?: string; // <- important
};

export default function ContactsTab({ restroCode }: Props) {
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  const [whatsapps, setWhatsapps] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restroCode) {
      setError("Missing restro code");
      return;
    }
    setLoading(true);
    setError(null);

    fetch(`/api/restros/${encodeURIComponent(String(restroCode))}/contacts`)
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Fetch failed (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (json?.ok === false && json?.error) {
          throw new Error(JSON.stringify(json));
        }
        setEmails(Array.isArray(json?.emails) ? json.emails : []);
        setWhatsapps(Array.isArray(json?.whatsapps) ? json.whatsapps : []);
      })
      .catch((err: any) => {
        console.error("Failed to load contacts:", err);
        setError(err?.message ?? String(err));
      })
      .finally(() => setLoading(false));
  }, [restroCode]);

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ marginTop: 0 }}>Contacts</h3>

      {loading && <div>Loading contacts…</div>}

      {error && <div style={{ color: "red" }}>Failed to load contacts — {String(error)}</div>}

      {!loading && !error && (
        <div>
          <h4>Emails</h4>
          {emails.length ? (
            <ul>
              {emails.map((e) => (
                <li key={e.id ?? e.value}>
                  <strong>{e.name || "—"}</strong>: {e.value} {e.active ? "(active)" : "(inactive)"}
                </li>
              ))}
            </ul>
          ) : (
            <div>No emails found.</div>
          )}

          <h4>WhatsApps / Mobiles</h4>
          {whatsapps.length ? (
            <ul>
              {whatsapps.map((w) => (
                <li key={w.id ?? w.value}>
                  <strong>{w.name || "—"}</strong>: {w.value} {w.active ? "(active)" : "(inactive)"}
                </li>
              ))}
            </ul>
          ) : (
            <div>No WhatsApp numbers found.</div>
          )}
        </div>
      )}
    </div>
  );
}
