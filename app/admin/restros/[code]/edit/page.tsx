// app/admin/restros/[code]/edit/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import RestroEditModal from "@/components/RestroEditModal"; // path adjust करें अगर अलग रखा है

type Restro = { [k: string]: any };

export default function RestroEditRoutePage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const { code } = params;

  const [restro, setRestro] = useState<Restro | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase: SupabaseClient | null =
    SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        if (!supabase) throw new Error("Supabase client not configured");

        const codeVal = /^\d+$/.test(String(code)) ? Number(code) : String(code);
        const { data, error } = await supabase
          .from("RestroMaster")
          .select("*")
          .eq("RestroCode", codeVal)
          .limit(1);

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
  }, [code, supabase]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "40vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
        <button
          onClick={() => router.back()}
          style={{ padding: "8px 12px", marginTop: 10 }}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <RestroEditModal
      restro={restro}
      initialTab="Basic Information"
      onClose={() => {
        router.back();
      }}
      onSave={async (payload: any) => {
        try {
          const res = await fetch(
            `/api/restros/${encodeURIComponent(String(code))}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(txt || `Save failed (${res.status})`);
          }
          const json = await res.json().catch(() => null);
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
