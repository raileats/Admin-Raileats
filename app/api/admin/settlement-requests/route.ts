// app/api/admin/settlement-requests/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const PAGE_SIZES = [20, 50, 100, 500];
const STATUSES = ["Pending", "Approved", "Rejected", "Paid", "Cancelled"];

function clean(v: unknown) { return String(v ?? "").trim(); }
function num(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function int(v: unknown, fallback: number) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function headers() {
  return { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache", Expires: "0" };
}
function formatIST(v: unknown) {
  const text = clean(v);
  if (!text) return "";
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return text;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(d);
}
function jwtSecret() {
  return process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.SUPABASE_JWT_SECRET || "";
}
async function adminName() {
  try {
    const token = cookies().get("admin_auth")?.value;
    const secret = jwtSecret();
    if (!token || !secret) return "Admin";
    const p = jwt.verify(token, secret) as any;
    return clean(p?.name || p?.email || p?.mobile || p?.user_id || "Admin");
  } catch { return "Admin"; }
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = int(sp.get("page"), 1);
    const requestedSize = int(sp.get("pageSize"), 20);
    const pageSize = PAGE_SIZES.includes(requestedSize) ? requestedSize : 20;
    const status = STATUSES.includes(clean(sp.get("status"))) ? clean(sp.get("status")) : "";
    const search = clean(sp.get("search"));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = serviceClient.from("SettlementRequests").select(`
      Id, RequestNo, RestroCode, RestroName, RequestDate, Amount,
      CurrentBalance, AvailableBalanceBeforeRequest, PendingAmountBeforeRequest,
      BankName, AccountNo, IFSC, Status, VendorRemarks, AdminRemarks,
      ApprovedBy, ApprovedDate, RejectedBy, RejectedDate,
      PaidBy, PaidDate, UTR, LedgerRDSId, CreatedAt, UpdatedAt
    `, { count: "exact" });

    if (status) q = q.eq("Status", status);
    if (search) {
      const digits = search.replace(/[^\d]/g, "");
      const parts = [
        `RequestNo.ilike.%${search}%`,
        `RestroName.ilike.%${search}%`,
        `UTR.ilike.%${search}%`,
      ];
      if (digits) parts.push(`RestroCode.eq.${Number(digits)}`);
      q = q.or(parts.join(","));
    }

    const { data, error, count } = await q.order("Id", { ascending: false }).range(from, to);
    if (error) throw new Error(error.message);

    const rows = (data || []).map((r: any) => ({
      ...r,
      Amount: num(r.Amount), CurrentBalance: num(r.CurrentBalance),
      AvailableBalanceBeforeRequest: num(r.AvailableBalanceBeforeRequest),
      PendingAmountBeforeRequest: num(r.PendingAmountBeforeRequest),
      RequestDateFormatted: formatIST(r.RequestDate || r.CreatedAt),
      ApprovedDateFormatted: formatIST(r.ApprovedDate),
      RejectedDateFormatted: formatIST(r.RejectedDate),
      PaidDateFormatted: formatIST(r.PaidDate),
    }));

    const total = Number(count || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return NextResponse.json({ ok: true, rows, total, page, pageSize, totalPages }, { headers: headers() });
  } catch (e: any) {
    console.error("ADMIN SETTLEMENT GET ERROR =>", e);
    return NextResponse.json({ ok: false, error: e?.message || "Unable to load settlement requests" }, { status: 500, headers: headers() });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestId = int(body?.requestId, 0);
    const action = clean(body?.action).toUpperCase();
    const adminRemarks = clean(body?.adminRemarks).slice(0, 500);
    const utr = clean(body?.utr).slice(0, 100);
    const paidDate = clean(body?.paidDate);

    if (!requestId) return NextResponse.json({ ok: false, error: "Invalid settlement request" }, { status: 400, headers: headers() });
    if (!["APPROVE", "REJECT", "PAID"].includes(action)) return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400, headers: headers() });
    if (action === "REJECT" && !adminRemarks) return NextResponse.json({ ok: false, error: "Rejection reason is required" }, { status: 400, headers: headers() });
    if (action === "PAID" && !utr) return NextResponse.json({ ok: false, error: "UTR number is required" }, { status: 400, headers: headers() });

    const paidDateValue = action === "PAID" && paidDate
      ? new Date(`${paidDate}T12:00:00+05:30`).toISOString()
      : null;

    const { data, error } = await serviceClient.rpc("admin_update_settlement_request", {
      p_request_id: requestId,
      p_action: action,
      p_admin_name: await adminName(),
      p_admin_remarks: adminRemarks || null,
      p_utr: utr || null,
      p_paid_date: paidDateValue,
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400, headers: headers() });

    return NextResponse.json({
      ok: true,
      message: action === "APPROVE" ? "Settlement request approved" : action === "REJECT" ? "Settlement request rejected" : "Settlement marked paid and ledger updated",
      result: data,
    }, { headers: headers() });
  } catch (e: any) {
    console.error("ADMIN SETTLEMENT PATCH ERROR =>", e);
    return NextResponse.json({ ok: false, error: e?.message || "Unable to update settlement request" }, { status: 500, headers: headers() });
  }
}
