// path: app/admin/restros/new/basic/page.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BasicPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveAndNext() {
    setSaving(true); setMsg(null);
    try {
      const body = { RestroName: name, BrandName: brand, RestroEmail: email };
      const res = await fetch("/api/restros", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
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
    } catch (err:any) { console.error(err); setMsg("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ padding: 18 }}>
      <h2>Basic Information</h2>
      <div style={{ maxWidth: 700 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Restaurant Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} style={{ width: "100%", padding:8, borderRadius:6, border:"1px solid #ddd" }} />
        <div style={{ height:8 }} />
        <label style={{ display: "block", marginBottom: 6 }}>Brand Name</label>
        <input value={brand} onChange={e=>setBrand(e.target.value)} style={{ width: "100%", padding:8, borderRadius:6, border:"1px solid #ddd" }} />
        <div style={{ height:8 }} />
        <label style={{ display: "block", marginBottom: 6 }}>Contact Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} style={{ width: "100%", padding:8, borderRadius:6, border:"1px solid #ddd" }} />

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
          <button onClick={()=>window.history.back()} style={{ padding:"8px 12px" }}>Cancel</button>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={saveAndNext} style={{ padding:"8px 12px", background:"#06a6e3", color:"#fff", border:"none", borderRadius:6 }} disabled={saving}>{saving ? "Saving..." : "Save & Next"}</button>
          </div>
        </div>
        {msg && <div style={{ color: "crimson", marginTop:8 }}>{msg}</div>}
      </div>
    </div>
  );
}
