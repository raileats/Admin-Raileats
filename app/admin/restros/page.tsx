// app/admin/restros/[code]/edit/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import RestroEditModal from "@/components/RestroEditModal"; // path adjust करो अगर अलग है

type Restro = { [k: string]: any };

export default function RestroEditRoutePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { code } = params;
  const [restro, setRestro] = useState<Restro | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // create supabase client on client-side using public anon key (must be set in env)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Will crash on runtime if not set; you can also handle gracefully
    console.error("Missing NEXT_PUBLIC_SUPABASE_* env vars");
  }
  const supabase: SupabaseClient | null = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        if (!supabase) throw new Error("Supabase client not configured");
        // adjust column name / filter if your RestroCode is numeric or stored differently
        const codeVal = /^\d+$/.test(String(code)) ? Number(code) : String(code);
        const { data, error } = await supabase.from("RestroMaster").select("*").eq("RestroCode", codeVal).limit(1);
        if (error) throw error;
        const row = (data && data[0]) ?? null;
        if (mounted) setRestro(row);
      } catch (e: any) {
        console.error("Load restro error:", e);
        if (mounted) setErr(e?.message ?? "Failed to load restro");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // if you prefer to redirect to list when no restro found:
  useEffect(() => {
    if (!loading && !restro) {
      // small delay so user sees something; or direct router.push("/admin/restros")
      // router.push("/admin/restros");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, restro]);

  if (loading) {
    return (
      <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading...
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

  return (
    // Render your modal component (client). Make sure RestroEditModal accepts these props.
    <RestroEditModal
      restro={restro}
      initialTab="Basic Information"
      onClose={() => {
        // go back to previous page (list) so history is preserved
        router.back();
      }}
      onSave={async (payload: any) => {
        // you can call your existing API to patch and return result
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
          // After successful save, go back so parent list is visible; parent can re-fetch list if needed
          router.back();
          return { ok: true, row: json?.row ?? payload };
        } catch (e: any) {
          console.error("save error:", e);
          return { ok: false, error: e?.message ?? String(e) };
        }
      }}
    />
  );
}
