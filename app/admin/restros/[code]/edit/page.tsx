// app/admin/restros/[code]/edit/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import RestroEditModal from "@/components/RestroEditModal"; // adjust path if needed

type Restro = { [k: string]: any };

// create supabase client once (will only run on client)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function showGlobalSpinner() {
  try {
    window.dispatchEvent(new CustomEvent("raileats:show-spinner"));
  } catch {}
}
function hideGlobalSpinner() {
  try {
    window.dispatchEvent(new CustomEvent("raileats:hide-spinner"));
  } catch {}
}

export default function RestroEditRoutePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { code } = params;
  const [restro, setRestro] = useState<Restro | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const ctl = new AbortController();

    const load = async () => {
      setLoading(true);
      setErr(null);
      showGlobalSpinner();
      try {
        if (!supabase) throw new Error("Supabase client not configured");
        const codeVal = /^\d+$/.test(String(code)) ? Number(code) : String(code);
        // fetch RestroMaster row
        const { data, error } = await supabase
          .from("RestroMaster")
          .select("*")
          .eq("RestroCode", codeVal)
          .limit(1)
          .abortSignal(ctl.signal);
        if (error) throw error;
        const row = (data && data[0]) ?? null;
        if (mounted) setRestro(row);
      } catch (e: any) {
        if (!mounted) return;
        console.error("Load restro error:", e);
        setErr(e?.message ?? "Failed to load restro");
      } finally {
        if (mounted) {
          setLoading(false);
          hideGlobalSpinner();
        }
      }
    };

    load();

    return () => {
      mounted = false;
      try {
        ctl.abort();
      } catch {}
    };
  }, [code]);

  if (loading) {
    return (
      <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "crimson", marginBottom: 12 }}>Error: {err}</div>
        <button onClick={() => router.back()} style={{ padding: "8px 12px" }}>
          Back
        </button>
      </div>
    );
  }

  if (!restro) {
    return (
      <div style={{ padding: 24 }}>
        <div>No restro found for code: {code}</div>
        <button onClick={() => router.back()} style={{ padding: "8px 12px", marginTop: 10 }}>
          Back
        </button>
      </div>
    );
  }

  // build friendly station display for tabs (BankTab may use it)
  const stationDisplay = (() => {
    // try best available fields; adjust if your table uses different keys
    const name = restro?.RestroName || restro?.StationName || restro?.Station || "";
    const stationCode = restro?.StationCode || restro?.Station || restro?.RestroCode || "";
    const state = restro?.State || "";
    const parts: string[] = [];
    if (stationCode) parts.push(String(stationCode));
    if (name) parts.push(String(name));
    if (state) parts.push(String(state));
    return parts.join(" • ");
  })();

  return (
    <RestroEditModal
      restro={restro}
      initialTab="Basic Information"
      stationDisplay={stationDisplay} // pass helpful context to tabs (optional; your modal should accept it)
      onClose={() => {
        router.back();
      }}
      onSave={async (payload: any) => {
        // show spinner while saving & disable actions
        setSaving(true);
        showGlobalSpinner();
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
          const json = await res.json().catch(() => null);
          // navigate back on success (your flow)
          router.back();
          return { ok: true, row: json?.row ?? payload };
        } catch (e: any) {
          console.error("save error:", e);
          return { ok: false, error: e?.message ?? String(e) };
        } finally {
          setSaving(false);
          hideGlobalSpinner();
        }
      }}
    />
  );
}
