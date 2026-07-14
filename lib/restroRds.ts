// lib/restroRds.ts

import type { SupabaseClient } from "@supabase/supabase-js";

type SyncRestroRdsInput = {
  supabase: SupabaseClient<any, any, any>;
  orderId: string;
  remarks?: string | null;
};

export type RestroRdsSyncResult = {
  ok: boolean;
  skipped?: boolean;
  warning?: string | null;
  data?: any;
};

function cleanText(value: any) {
  const text = String(value ?? "").trim();
  return text || null;
}

/**
 * Final order marking ke baad RestroRDS ko sync karta hai.
 *
 * Main calculation aur balance handling Supabase ke
 * sync_restro_rds RPC function me hoti hai taaki:
 *
 * 1. Same OrderId duplicate na ho.
 * 2. Same restaurant ke concurrent orders me balance clash na ho.
 * 3. First order PreviousBal = 0 ho.
 * 4. Next order ka PreviousBal previous CurrentBal ho.
 * 5. Old order correction ke baad subsequent balances recalculate hon.
 */
export async function syncRestroRdsForFinalOrder({
  supabase,
  orderId,
  remarks = null,
}: SyncRestroRdsInput): Promise<RestroRdsSyncResult> {
  try {
    const normalizedOrderId = cleanText(orderId);

    if (!normalizedOrderId) {
      return {
        ok: false,
        skipped: true,
        warning: "RestroRDS sync skipped: OrderId missing",
      };
    }

    const { data, error } = await supabase.rpc(
      "sync_restro_rds",
      {
        p_order_id: normalizedOrderId,
        p_remarks: cleanText(remarks),
      }
    );

    if (error) {
      console.error(
        "[RestroRDS] RPC error:",
        {
          orderId: normalizedOrderId,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
      );

      return {
        ok: false,
        skipped: false,
        warning:
          error.message ||
          "Failed to sync RestroRDS",
      };
    }

    if (data?.ok === false) {
      console.error(
        "[RestroRDS] Sync failed:",
        data
      );

      return {
        ok: false,
        skipped: Boolean(data?.skipped),
        warning:
          cleanText(data?.error) ||
          "RestroRDS sync failed",
        data,
      };
    }

    return {
      ok: true,
      skipped: Boolean(data?.skipped),
      warning: null,
      data,
    };
  } catch (error: any) {
    console.error(
      "[RestroRDS] Unexpected error:",
      error
    );

    return {
      ok: false,
      skipped: false,
      warning:
        error?.message ||
        "Unexpected RestroRDS sync error",
    };
  }
}
