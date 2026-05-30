export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function cleanText(value: any) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeStatus(value: any) {
  const raw = cleanText(value);
  if (!raw) return null;

  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases: Record<string, string> = {
    booked: "Booked",
    verification: "In Verification",
    inverification: "In Verification",
    neworder: "New Order",
    inkitchen: "In Kitchen",
    outfordelivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    notdelivered: "Not Delivered",
    baddelivery: "Bad Delivery",
  };

  return aliases[key] || raw;
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

  return candidates.find((key) => row && row[key] !== undefined) || "Status";
}

function missingColumnName(message: string) {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    /column "([^"]+)" does not exist/i,
    /record "new" has no field "([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

async function findOrder(supabase: any, orderId: string) {
  const idColumns = ["OrderId", "id", "orderId", "order_id"];

  for (const column of idColumns) {
    const { data, error } = await supabase
      .from("Orders")
      .select("*")
      .eq(column, orderId)
      .maybeSingle();

    if (data) {
      return { row: data, idColumn: column, error: null };
    }

    if (error) {
      const missing = missingColumnName(error.message || "");
      if (missing === column) continue;
      return { row: null, idColumn: column, error };
    }
  }

  return { row: null, idColumn: "OrderId", error: null };
}

async function updateOrderStatus(
  supabase: any,
  idColumn: string,
  orderId: string,
  existing: any,
  newStatus: string,
  subStatus: string | null,
  changedAt: string
) {
  const statusColumn = pickStatusColumn(existing);
  const payload: Record<string, any> = {
    [statusColumn]: newStatus,
  };

  if (existing.SubStatus !== undefined) payload.SubStatus = subStatus;
  if (existing.subStatus !== undefined) payload.subStatus = subStatus;
  if (existing.OrderSubStatus !== undefined) payload.OrderSubStatus = subStatus;
  if (existing.UpdatedAt !== undefined) payload.UpdatedAt = changedAt;
  if (existing.updated_at !== undefined) payload.updated_at = changedAt;
  if (existing.LastModified !== undefined) payload.LastModified = changedAt;

  return supabase
    .from("Orders")
    .update(payload)
    .eq(idColumn, orderId)
    .select("*");
}

async function insertHistoryBestEffort(supabase: any, payload: Record<string, any>) {
  let attempt = { ...payload };

  for (let i = 0; i < 16; i += 1) {
    const { data, error } = await supabase
      .from("OrderStatusHistory")
      .insert(attempt)
      .select("*")
      .maybeSingle();

    if (!error) {
      return { data, error: null };
    }

    const missing = missingColumnName(error.message || "");
    if (!missing || !(missing in attempt)) {
      return { data: null, error };
    }

    const nextAttempt = { ...attempt };
    delete nextAttempt[missing];
    attempt = nextAttempt;
  }

  return {
    data: null,
    error: { message: "Unable to insert status history with available columns" },
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId?: string; id?: string } }
) {
  try {
    const orderId = decodeURIComponent(
      String(params.orderId ?? params.id ?? "")
    ).trim();

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Order id is required" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const newStatus = normalizeStatus(
      body.newStatus ??
        body.NewStatus ??
        body.status ??
        body.Status ??
        body.orderStatus ??
        body.OrderStatus
    );

    if (!newStatus) {
      return NextResponse.json(
        { ok: false, error: "New status is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    const { row: existing, idColumn, error: findError } = await findOrder(
      supabase,
      orderId
    );

    if (findError) {
      return NextResponse.json(
        { ok: false, error: findError.message || "Failed to load order" },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: `Order not found: ${orderId}` },
        { status: 404 }
      );
    }

    const changedAt = new Date().toISOString();
    const statusColumn = pickStatusColumn(existing);
    const oldStatus = cleanText(existing[statusColumn]);
    const subStatus = cleanText(body.subStatus ?? body.SubStatus);
    const remarks = cleanText(body.remarks ?? body.Remarks);
    const note = cleanText(body.note ?? body.Note ?? remarks ?? subStatus);
    const userType = cleanText(body.userType ?? body.UserType) || "Admin";
    const userName =
      cleanText(body.userName ?? body.UserName ?? body.changedBy ?? body.ChangedBy) ||
      "Admin";
    const actionSource =
      cleanText(body.actionSource ?? body.ActionSource) || userType;

    const { data: updatedRows, error: updateError } = await updateOrderStatus(
      supabase,
      idColumn,
      orderId,
      existing,
      newStatus,
      subStatus,
      changedAt
    );

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message || "Failed to update order" },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No order row updated" },
        { status: 400 }
      );
    }

    const historyPayload = {
      OrderId: orderId,
      OldStatus: oldStatus,
      PreviousStatus: oldStatus,
      NewStatus: newStatus,
      Status: newStatus,
      SubStatus: subStatus,
      Remarks: remarks,
      Note: note,
      ChangedBy: userName,
      UserType: userType,
      UserName: userName,
      ActionSource: actionSource,
      ChangedAt: changedAt,
      CreatedAt: changedAt,
    };

    const { data: historyRow, error: historyError } =
      await insertHistoryBestEffort(supabase, historyPayload);

    return NextResponse.json({
      ok: true,
      row: updatedRows[0],
      history: historyRow,
      historyWarning: historyError?.message || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
