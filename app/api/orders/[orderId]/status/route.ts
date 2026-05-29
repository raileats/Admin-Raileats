export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    { auth: { persistSession: false } }
  );
}

function cleanText(value: any) {
  const text = String(value ?? "").trim();
  return text || null;
}

function pickStatusColumn(row: any) {
  const candidates = [
    "OrderStatus",
    "Status",
    "CurrentStatus",
    "OrderCurrentStatus",
    "orderStatus",
    "status",
  ];

  return candidates.find((key) => row && row[key] !== undefined) || "OrderStatus";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = decodeURIComponent(params.id || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Order id is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const newStatus = cleanText(body.newStatus ?? body.NewStatus);

    if (!newStatus) {
      return NextResponse.json(
        { ok: false, error: "newStatus is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: existing, error: existingError } = await supabase
      .from("Orders")
      .select("*")
      .eq("OrderId", orderId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const statusColumn = pickStatusColumn(existing);
    const oldStatus = cleanText(existing[statusColumn]);
    const subStatus = cleanText(body.subStatus ?? body.SubStatus);
    const remarks = cleanText(body.remarks ?? body.Remarks);
    const note = cleanText(body.note ?? body.Note ?? remarks);
    const userType = cleanText(body.userType ?? body.UserType) || "Admin";
    const userName =
      cleanText(body.userName ?? body.UserName ?? body.changedBy ?? body.ChangedBy) ||
      "Admin";
    const actionSource =
      cleanText(body.actionSource ?? body.ActionSource) || userType;
    const changedAt = new Date().toISOString();

    const orderUpdate: Record<string, any> = {
      [statusColumn]: newStatus,
    };

    if (existing.SubStatus !== undefined) orderUpdate.SubStatus = subStatus;
    if (existing.subStatus !== undefined) orderUpdate.subStatus = subStatus;
    if (existing.UpdatedAt !== undefined) orderUpdate.UpdatedAt = changedAt;
    if (existing.updated_at !== undefined) orderUpdate.updated_at = changedAt;

    const { data: updatedRows, error: updateError } = await supabase
      .from("Orders")
      .update(orderUpdate)
      .eq("OrderId", orderId)
      .select("*");

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    const historyPayload = {
      OrderId: orderId,
      OldStatus: oldStatus,
      NewStatus: newStatus,
      SubStatus: subStatus,
      Remarks: remarks,
      Note: note,
      ChangedBy: userName,
      UserType: userType,
      UserName: userName,
      ActionSource: actionSource,
      ChangedAt: changedAt,
    };

    const { data: historyRow, error: historyError } = await supabase
      .from("OrderStatusHistory")
      .insert(historyPayload)
      .select("*")
      .maybeSingle();

    if (historyError) {
      return NextResponse.json(
        {
          ok: false,
          error: historyError.message,
          orderUpdated: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      row: updatedRows?.[0] ?? null,
      history: historyRow,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
