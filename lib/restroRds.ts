// lib/restroRds.ts

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

type SyncRestroRdsInput = {
  supabase?: SupabaseClient<any, any, any>;
  orderId: string;
  remarks?: string | null;
};

export type RestroRdsSyncResult = {
  ok: boolean;
  skipped: boolean;
  locked: boolean;
  warning: string | null;
  data: any;
};

export type RestroRdsLockResult = {
  locked: boolean;
  row: {
    RDSId?: number | string | null;
    OrderId?: string | null;
    RestroCode?: number | string | null;
    Status?: string | null;
    SubStatus?: string | null;
    SettlementAmount?: number | string | null;
    CreatedAt?: string | null;
  } | null;
  error: string | null;
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

export async function checkRestroRdsOrderLocked({
  orderId,
}: {
  orderId: string;
}): Promise<RestroRdsLockResult> {
  const normalizedOrderId =
    cleanText(orderId);

  if (!normalizedOrderId) {
    return {
      locked: false,
      row: null,
      error:
        "RestroRDS lock check failed: OrderId missing",
    };
  }

  try {
    const supabase =
      getRestroRdsSupabase();

    const { data, error } =
      await supabase
        .from("RestroRDS")
        .select(
          `
          RDSId,
          OrderId,
          RestroCode,
          Status,
          SubStatus,
          SettlementAmount,
          CreatedAt
          `
        )
        .eq(
          "OrderId",
          normalizedOrderId
        )
        .maybeSingle();

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
        "[RestroRDS] Lock check database error:",
        {
          orderId:
            normalizedOrderId,
          error: fullError,
        }
      );

      return {
        locked: false,
        row: null,
        error:
          fullError ||
          "RestroRDS lock check failed",
      };
    }

    if (data) {
      console.warn(
        `[RestroRDS] Order already locked: ${normalizedOrderId}`
      );

      return {
        locked: true,
        row: data,
        error: null,
      };
    }

    return {
      locked: false,
      row: null,
      error: null,
    };
  } catch (error: any) {
    const message =
      error?.message ||
      "Unexpected RestroRDS lock check error";

    console.error(
      "[RestroRDS] Lock check unexpected error:",
      {
        orderId:
          normalizedOrderId,
        message,
        stack:
          error?.stack || null,
      }
    );

    return {
      locked: false,
      row: null,
      error: message,
    };
  }
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
      locked: false,
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
        locked: false,
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
        locked: false,
        warning:
          "RestroRDS RPC returned empty response",
        data: null,
      };
    }

    const isLocked =
      Boolean(data?.locked);

    if (isLocked) {
      const warning =
        cleanText(data?.error) ||
        cleanText(data?.message) ||
        "Unable to mark order. Order already marked.";

      console.warn(
        "[RestroRDS] RPC order locked:",
        data
      );

      return {
        ok: false,
        skipped: true,
        locked: true,
        warning,
        data,
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
        locked: false,

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
      locked: false,
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
      locked: false,
      warning: message,
      data: null,
    };
  }
}
