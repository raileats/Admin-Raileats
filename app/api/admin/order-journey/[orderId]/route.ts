// app/api/admin/order-journey/[orderId]/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";

  if (!url) {
    throw new Error(
      "SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is missing",
    );
  }

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      orderId?: string;
    };
  },
) {
  try {
    const orderId = cleanText(
      decodeURIComponent(
        String(params?.orderId ?? ""),
      ),
    );

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          error: "OrderId is required",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = supabaseServer();

    const {
      data: journey,
      error,
    } = await supabase
      .from("OrderJourney")
      .select("*")
      .eq("OrderId", orderId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        ok: true,
        orderId,
        journey: journey ?? null,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error: any) {
    console.error(
      "ADMIN ORDER JOURNEY GET ERROR",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to load OrderJourney",
      },
      {
        status: 500,
      },
    );
  }
}
