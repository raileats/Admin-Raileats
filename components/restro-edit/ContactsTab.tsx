"use client";

import React, { useEffect, useState } from "react";

type Props = {
  local?: any;
  updateField?: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
  restroCode?: string;
};

export default function ContactsTab({ restroCode = "", local = {}, updateField }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [whatsapps, setWhatsapps] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!restroCode) {
      setError("Missing restroCode — cannot load contacts.");
      return;
    }
    setLoading(true);
    setError(null);

    fetch(`/api/restros/${encodeURIComponent(String(restroCode))}/contacts`)
      .then(async (res) => {
        if (!res.ok) {
          // try to read JSON body (API usually returns JSON error details)
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Fetch failed (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        // Expect API to return something like { emails: [...], whatsapps: [...] }
        const e = Array.isArray(json?.emails) ? json.emails : [];
        const w = Array.isArray(json?.whatsapps) ? json.whatsapps : [];
        setEmails(e);
        setWhatsapps(w);
        setDirty(false);
      })
      .catch((err) => {
        // Show helpful error but keep UI usable (allow manual editing)
        try {
          // if API returned JSON text, parse to show message
          const parsed = JSON.parse(String(err.message));
          setError(`Failed to load contacts — ${JSON.stringify(parsed)}`);
        } catch {
          setError(`Failed to load contacts — ${String(err.message)}`);
        }
        // keep empty arrays so user can add manually
        setEmails([]);
        setWhatsapps([]);
      })
      .finally(() => setLoading(false));
  }, [restroCode]);

  function updateList(setter: (s: any) => void, idx: number, value: string) {
    setter((prev: string[]) => {
      const copy = [...prev];
      copy[idx] = value;
      setDirty(true);
      return copy;
    });
  }

  function addItem(setter: (s: any) => void) {
    setter((prev: string[]) => {
      setDirty(true);
      return [...prev, ""];
    });
  }
  function removeItem(setter: (s: any) => void, idx: number) {
    setter((prev: string[]) => {
      const copy = prev.filter((_, i) => i !== idx);
      setDirty(true);
      return copy;
    });
  }

  async function handleSave() {
    if (!restroCode) {
      setError("Cannot save: missing restro code.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { emails, whatsapps };
      const res = await fetch(`/api/restros/${encodeURIComponent(String(restroCode))}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        // Try parse JSON error message
        try {
          const j = JSON.parse(txt || "");
          throw new Error(JSON.stringify(j));
        } catch {
          throw new Error(txt || `Save failed (${res.status})`);
        }
      }
      // success — mark clean
      setDirty(false);
      // optionally update parent fields if desired
      if (typeof updateField === "function") {
        updateField("ContactsLoadedAt", new Date().toISOString());
      }
    } catch (err: any) {
      // show server error (like "Could not find the table 'public.restro_email'")
      setError(String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ marginTop: 0 }}>Contacts</h3>

      {restroCode ? <div style={{ color: "#0b7285", marginBottom: 12 }}>Outlet: {restroCode}</div> : null}

      {loading && <div>Loading contacts…</div>}

      {error && (
        <div style={{ color: "red", marginBottom: 12, whiteSpace: "pre-wrap" }}>
          {error}
        </div>
      )}

      <div style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600 }}>Emails</label>
          {(emails.length === 0) && <div style={{ color: "#777", margin: "6px 0" }}>No saved emails — add below.</div>}
          {emails.map((em, i) => (
            <div key={"e" + i} style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={em}
                onChange={(ev) => updateList(setEmails, i, ev.target.value)}
                placeholder="name@example.com"
                style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #e3e3e3" }}
              />
              <button onClick={() => removeItem(setEmails, i)} style={{ padding: "6px 8px", cursor: "pointer" }}>Remove</button>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => addItem(setEmails)} style={{ padding: "8px 10px", cursor: "pointer" }}>Add Email</button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600 }}>WhatsApp / Phone numbers</label>
          {(whatsapps.length === 0) && <div style={{ color: "#777", margin: "6px 0" }}>No saved numbers — add below.</div>}
          {whatsapps.map((ph, i) => (
            <div key={"w" + i} style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={ph}
                onChange={(ev) => updateList(setWhatsapps, i, ev.target.value)}
                placeholder="+91 9XXXXXXXXX"
                style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #e3e3e3" }}
              />
              <button onClick={() => removeItem(setWhatsapps, i)} style={{ padding: "6px 8px", cursor: "pointer" }}>Remove</button>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => addItem(setWhatsapps)} style={{ padding: "8px 10px", cursor: "pointer" }}>Add Number</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button disabled={!dirty || saving} onClick={handleSave} style={{ padding: "8px 12px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, cursor: (dirty && !saving) ? "pointer" : "not-allowed" }}>
            {saving ? "Saving..." : "Save Contacts"}
          </button>

          <button disabled={saving} onClick={() => { /* just reset local to previously fetched (re-run effect) */ setEmails([...emails]); setWhatsapps([...whatsapps]); setDirty(false); }} style={{ padding: "8px 12px" }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
