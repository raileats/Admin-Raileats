// app/api/admin/payment-requests/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const BUCKET = "payment-proofs";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function positiveInteger(value: unknown, fallback: number) {
  const parsed = Number.parseInt(cleanText(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatIndiaDateTime(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function getJwtSecret() {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ""
  );
}

async function getAdminName() {
  try {
    const token = cookies().get("admin_auth")?.value;
    const secret = getJwtSecret();

    if (!token || !secret) return "Admin";

    const payload = jwt.verify(token, secret) as any;

    return cleanText(
      payload?.name ||
        payload?.email ||
        payload?.mobile ||
        payload?.user_id ||
        "Admin"
    );
  } catch {
    return "Admin";
  }
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const page = positiveInteger(params.get("page"), 1);
    const pageSize = [20, 50, 100, 500].includes(
      positiveInteger(params.get("pageSize"), 20)
    )
      ? positiveInteger(params.get("pageSize"), 20)
      : 20;

    const status = cleanText(params.get("status"));
    const search = cleanText(params.get("search"))
      .replace(/[%_,]/g, "")
      .slice(0, 100);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = serviceClient
      .from("RestroPaymentRequests")
      .select(
        `
          Id,
          RequestNo,
          RestroCode,
          RestroName,
          Amount,
          PaymentDate,
          PaymentMode,
          BankName,
          UTR,
          ReferenceNo,
          ScreenshotPath,
          ScreenshotName,
          Status,
          VendorRemarks,
          AdminRemarks,
          RequestedAt,
          ReceivedBy,
          ReceivedAt,
          RejectedBy,
          RejectedAt,
          LedgerRDSId,
          RERDSId,
          SettlementId,
          CreatedAt,
          UpdatedAt
        `,
        { count: "exact" }
      );

    if (status) {
      query = query.eq("Status", status);
    }

    if (search) {
      const filters = [
        `RequestNo.ilike.%${search}%`,
        `RestroName.ilike.%${search}%`,
        `UTR.ilike.%${search}%`,
        `ReferenceNo.ilike.%${search}%`,
      ];

      const digits = search.replace(/\D/g, "");
      if (digits) filters.push(`RestroCode.eq.${Number(digits)}`);

      query = query.or(filters.join(","));
    }

    const { data, error, count } = await query
      .order("Id", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    const rows = await Promise.all(
      (data || []).map(async (row: any) => {
        let screenshotUrl: string | null = null;

        if (row.ScreenshotPath) {
          const signed = await serviceClient.storage
            .from(BUCKET)
            .createSignedUrl(row.ScreenshotPath, 60 * 30);

          screenshotUrl = signed.data?.signedUrl || null;
        }

        return {
          ...row,
          ScreenshotUrl: screenshotUrl,
          RequestedAtFormatted: formatIndiaDateTime(
            row.RequestedAt || row.CreatedAt
          ),
          ReceivedAtFormatted: formatIndiaDateTime(row.ReceivedAt),
          RejectedAtFormatted: formatIndiaDateTime(row.RejectedAt),
        };
      })
    );

    const total = Number(count || 0);

    return NextResponse.json(
      {
        ok: true,
        rows,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      { status: 200, headers: noStoreHeaders() }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to load payment requests",
      },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const requestId = positiveInteger(body?.requestId, 0);
    const action = cleanText(body?.action).toUpperCase();
    const adminRemarks = cleanText(body?.adminRemarks).slice(0, 500);

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment request" },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    if (!["RECEIVED", "REJECT"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid action" },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    if (action === "REJECT" && !adminRemarks) {
      return NextResponse.json(
        { ok: false, error: "Rejection reason is required" },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const { data, error } = await serviceClient.rpc(
      "admin_confirm_restro_payment_request",
      {
        p_request_id: requestId,
        p_action: action,
        p_admin_name: await getAdminName(),
        p_admin_remarks: adminRemarks || null,
      }
    );

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          action === "RECEIVED"
            ? "Payment marked received; Restro RDS and RE RDS updated"
            : "Payment request rejected",
        result: data,
      },
      { status: 200, headers: noStoreHeaders() }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to update payment request",
      },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}
