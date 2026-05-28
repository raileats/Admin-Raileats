"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import RestroEditModal from "@/components/RestroEditModal";
import RestroUserPasswordTab from "@/components/restro-edit/RestroUserPasswordTab";

type Restro = {
  RestroCode: string | number;
  [key: string]: any;
};

function normalizeRestro(data: any, fallbackCode: string | number): Restro {
  return {
    ...data,
    RestroCode: data?.RestroCode ?? fallbackCode,
    BrandName: data?.BrandNameifAny,
    OpenTime: data?.open_time,
    ClosedTime: data?.closed_time,
  };
}

function parseRestroCode(code: string) {
  return /^\d+$/.test(code) ? Number(code) : code;
}

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
  const [modalVersion, setModalVersion] = useState(0);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase: SupabaseClient | null = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });
  }, [SUPABASE_URL, SUPABASE_ANON_KEY]);

  async function loadRestro(options?: { silent?: boolean }) {
    if (!supabase) throw new Error("Supabase not configured");

    if (!options?.silent) {
      setLoading(true);
    }

    setErr(null);

    const restroCode = parseRestroCode(restroCodeParam);

    const { data, error } = await supabase
      .from("RestroMaster")
      .select("*")
      .eq("RestroCode", restroCode)
      .single();

    if (error) throw error;

    const nextRestro = normalizeRestro(data, restroCode);
    setRestro(nextRestro);

    return nextRestro;
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const fresh = await loadRestro();
        if (!mounted) return;
        setRestro(fresh);
      } catch (e: any) {
        console.error("Load restro failed:", e);
        if (mounted) {
          setErr(e?.message || "Failed to load restaurant");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [restroCodeParam, supabase]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading restaurant...
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

  return (
    <RestroEditModal
      key={`${restro.RestroCode}-${restro.updated_at ?? restro.LastModified ?? modalVersion}`}
      restro={{
        ...restro,
        ExtraTabs: [
          {
            key: "Restro User & Password",
            label: "Restro User & Password",
            component: (
              <RestroUserPasswordTab
                form={restro}
                setForm={setRestro}
              />
            ),
          },
        ],
      }}
      initialTab="Basic Information"
      onClose={() => router.back()}
      onSave={async (payload: any) => {
        try {
          const res = await fetch(
            `/api/restros/${encodeURIComponent(String(restro.RestroCode))}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
              body: JSON.stringify(payload),
            }
          );

          const json = await res.json().catch(() => null);

          if (!res.ok) {
            throw new Error(json?.error || "Save failed");
          }

          const freshRestro = await loadRestro({ silent: true });
          setModalVersion((current) => current + 1);

          return {
            ok: true,
            row: freshRestro,
          };
        } catch (e: any) {
          console.error("Save error:", e);

          return {
            ok: false,
            error: e?.message || "Save failed",
          };
        }
      }}
    />
  );
}
