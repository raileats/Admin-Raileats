"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import RestroEditModal from "@/components/RestroEditModal";

type Restro = {
  RestroCode: string | number;
  [key: string]: any;
};

export default function RestroEditRoutePage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const restroCodeParam = params.code;

  const [restro, setRestro] = useState<Restro | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase: SupabaseClient | null = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }, []);

  /* ================= LOAD RESTRO ================= */
  useEffect(() => {
    let mounted = true;

    async function loadRestro() {
      setLoading(true);
      setErr(null);

      try {
        if (!supabase) throw new Error("Supabase not configured");

        const restroCode =
          /^\d+$/.test(restroCodeParam)
            ? Number(restroCodeParam)
            : restroCodeParam;

        const { data, error } = await supabase
          .from("RestroMaster")
          .select("*")
          .eq("RestroCode", restroCode)
          .single();

        if (error) throw error;

        if (mounted) {
          setRestro({
            ...data,
            RestroCode: restroCode,
          });
        }
      } catch (e: any) {
        console.error("Load restro failed:", e);
        if (mounted) setErr(e?.message || "Failed to load restaurant");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRestro();
    return () => {
      mounted = false;
    };
  }, [restroCodeParam, supabase]);

  /* ================= STATES ================= */
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading restaurant…
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ color: "crimson", marginBottom: 12 }}>
          Error: {err}
        </div>
        <button onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  if (!restro) {
    return (
      <div style={{ padding: 40 }}>
        No restaurant found for code: {restroCodeParam}
      </div>
    );
  }

  /* ================= RENDER MODAL ================= */
  return (
    <RestroEditModal
      restro={restro}
      restroCode={restro.RestroCode}
      initialTab="Basic Information"
      onClose={() => router.back()}
      onSave={async (payload: any) => {
        try {
          const res = await fetch(
            `/api/restros/${encodeURIComponent(
              String(restro.RestroCode)
            )}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Save failed");
          }

          const json = await res.json();
          return { ok: true, row: json?.row ?? payload };
        } catch (e: any) {
          console.error("Save error:", e);
          return { ok: false, error: e?.message || "Save failed" };
        }
      }}
    />
  );
}
