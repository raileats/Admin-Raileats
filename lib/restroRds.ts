// lib/restroRds.ts

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

type SyncRestroRdsInput = {
  /*
   * Existing route compatibility ke liye optional rakha hai.
   * RestroRDS sync apna secure service-role client use karega.
   */
  supabase?: SupabaseClient<any, any, any>;

  orderId: string;
  remarks?: string | null;
};

export type RestroRdsSyncResult = {
  ok: boolean;
  skipped: boolean;
  warning: string | null;
  data: any;
};

function cleanText(value: any) {
  const text = String(value ?? "").trim();
  return text || null;
}

function getRestroRdsSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";

  if (!url) {
    throw new Error(
      "RestroRDS: Supabase URL environment variable missing"
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "RestroRDS: SUPABASE_SERVICE_ROLE_KEY missing in Vercel"
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function syncRestroRdsForFinalOrder({
  orderId,
  remarks = null,
}: SyncRestroRdsInput): Promise<RestroRdsSyncResult> {
  const normalizedOrderId =
    cleanText(orderId);

  if (!normalizedOrderId) {
    return {
      ok: false,
      skipped: true,
      warning:
        "RestroRDS sync skipped: OrderId missing",
      data: null,
    };
  }

  try {
    const supabase =
      getRestroRdsSupabase();

    console.log(
      `[RestroRDS] Starting sync for order ${normalizedOrderId}`
    );

    const { data, error } =
      await supabase.rpc(
        "sync_restro_rds",
        {
          p_order_id:
            normalizedOrderId,

          p_remarks:
            cleanText(remarks),
        }
      );

    if (error) {
      const fullError = [
        error.message,
        error.details,
        error.hint,
        error.code,
      ]
        .filter(Boolean)
        .join(" | ");

      console.error(
        "[RestroRDS] RPC database error:",
        {
          orderId:
            normalizedOrderId,
          error: fullError,
        }
      );

      return {
        ok: false,
        skipped: false,
        warning:
          fullError ||
          "RestroRDS RPC failed",
        data: null,
      };
    }

    if (!data) {
      console.error(
        "[RestroRDS] RPC returned empty data:",
        normalizedOrderId
      );

      return {
        ok: false,
        skipped: false,
        warning:
          "RestroRDS RPC returned empty response",
        data: null,
      };
    }

    if (data?.ok === false) {
      console.error(
        "[RestroRDS] Function returned failure:",
        data
      );

      return {
        ok: false,
        skipped:
          Boolean(data?.skipped),

        warning:
          cleanText(data?.error) ||
          cleanText(data?.reason) ||
          "RestroRDS function failed",

        data,
      };
    }

    console.log(
      "[RestroRDS] Sync completed:",
      data
    );

    return {
      ok: true,
      skipped:
        Boolean(data?.skipped),
      warning: null,
      data,
    };
  } catch (error: any) {
    const message =
      error?.message ||
      "Unexpected RestroRDS sync error";

    console.error(
      "[RestroRDS] Unexpected error:",
      {
        orderId:
          normalizedOrderId,
        message,
        stack:
          error?.stack || null,
      }
    );

    return {
      ok: false,
      skipped: false,
      warning: message,
      data: null,
    };
  }
}
