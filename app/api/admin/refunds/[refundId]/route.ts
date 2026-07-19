export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", { auth: { persistSession: false } });
}

export async function PATCH(req: NextRequest, { params }: { params: { refundId: string } }) {
  try {
    const refundId = decodeURIComponent(String(params.refundId || "")).trim();
    const body = await req.json().catch(() => ({}));
    const refundStatus = String(body.refundStatus || body.RefundStatus || "").trim();
    if (!refundId || !refundStatus) return NextResponse.json({ ok: false, error: "Refund id and status are required" }, { status: 400 });
    const allowed = ["Pending", "Approved", "Processing", "Success", "Failed"];
    if (!allowed.includes(refundStatus)) return NextResponse.json({ ok: false, error: "Invalid refund status" }, { status: 400 });
    const supabase = supabaseServer();
    const numeric = Number(refundId);
    let lookup = supabase.from("OrderRefunds").select("*");
    lookup = Number.isFinite(numeric) ? lookup.eq("RefundId", numeric) : lookup.eq("RefundNo", refundId);
    const { data: current, error: readError } = await lookup.maybeSingle();
    if (readError || !current) return NextResponse.json({ ok: false, error: readError?.message || "Refund not found" }, { status: 404 });
    const now = new Date().toISOString();
    const update: any = { RefundStatus: refundStatus, UpdatedAt: now, AdminRemarks: String(body.remarks || body.AdminRemarks || "").trim() || null };
    if (body.refundAmount !== undefined && Number.isFinite(Number(body.refundAmount))) update.RefundAmount = Number(body.refundAmount);
    if (refundStatus === "Approved") { update.ApprovedAt = now; update.ApprovedBy = String(body.adminName || "Admin"); }
    if (refundStatus === "Success") { update.CompletedAt = now; update.CompletedBy = String(body.adminName || "Admin"); }
    if (refundStatus === "Failed") update.FailedAt = now;
    let q = supabase.from("OrderRefunds").update(update);
    q = current.RefundId != null ? q.eq("RefundId", current.RefundId) : q.eq("RefundNo", current.RefundNo);
    const { data, error } = await q.select("*").maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, refund: data });
  } catch (error: any) { return NextResponse.json({ ok: false, error: error?.message || "Internal server error" }, { status: 500 }); }
}
