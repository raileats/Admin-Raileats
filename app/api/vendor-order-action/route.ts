export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";
import { verifyVendorOrderActionToken } from "@/lib/vendorOrderActionToken";
import { PATCH as updateOrderStatus } from "@/app/api/orders/[orderId]/status/route";

const REJECTION_REASONS = [
  "Customer Plan Change",
  "Customer Call Not Connect",
  "Customer Not On Seat",
  "Customer Refused Delivery",
  "Delivery Boy Missed",
  "Restro Closed",
  "Train Late",
  "Train Divert",
  "Item Issue",
  "Restro Refused without Reason",
  "Other",
  "Low & Order",
  "Natural Calamity",
] as const;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function escapeHtml(value: unknown) {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalize(value: unknown) {
  return text(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function page(title: string, content: string, tone = "#2563eb") {
  return new Response(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#eef2f7;font-family:Arial,sans-serif;color:#14213d">
  <main style="max-width:560px;margin:32px auto;padding:0 14px">
    <section style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,.12)">
      <header style="background:#ffffff;padding:22px;text-align:center;border-bottom:1px solid #e2e8f0">
        <img src="/logo.png" width="72" height="72" alt="RailEats" style="border-radius:50%">
        <div style="font-size:27px;font-weight:900">RailEats</div>
      </header>
      <div style="height:6px;background:${tone}"></div>
      <div style="padding:28px">${content}</div>
    </section>
  </main>
</body></html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function errorPage(message: string, status = 400) {
  const response = page(
    "Unable to process order",
    `<h1 style="margin-top:0">Unable to process order</h1><p style="color:#64748b">${escapeHtml(message)}</p>`,
    "#dc2626"
  );
  return new Response(response.body, { status, headers: response.headers });
}

async function loadOrder(orderId: string, restroCode: string) {
  const { data, error } = await serviceClient
    .from("Orders")
    .select("OrderId,RestroCode,RestroName,Status,CustomerName,CustomerMobile,TrainNumber,Coach,Seat,DeliveryDate,DeliveryTime,TotalAmount,PaymentMode")
    .eq("OrderId", orderId)
    .eq("RestroCode", restroCode)
    .maybeSingle();

  return { order: data, error };
}

async function loadOrderItems(orderId: string) {
  const { data, error } = await serviceClient
    .from("OrderItems")
    .select("ItemName,Quantity,LineTotal")
    .eq("OrderId", orderId);

  return { items: data || [], error };
}

function printPage(order: any, items: any[]) {
  const rows = items.length
    ? items.map((item) => `<tr><td>${escapeHtml(item.ItemName || "Item")}</td><td class="center">${escapeHtml(item.Quantity || 0)}</td><td class="right">₹${Number(item.LineTotal || 0).toFixed(2)}</td></tr>`).join("")
    : '<tr><td colspan="3">Order item details unavailable</td></tr>';

  return new Response(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order ${escapeHtml(order.OrderId)}</title>
<style>
  *{box-sizing:border-box} body{margin:0;background:#eef2f7;font-family:Arial,sans-serif;color:#111827}.toolbar{max-width:620px;margin:20px auto 10px;padding:0 12px}.print-button{width:100%;border:0;border-radius:9px;padding:13px;background:#14213d;color:#fff;font-size:16px;font-weight:800;cursor:pointer}.order-card{max-width:620px;margin:0 auto 28px;background:#fff;padding:26px;border:1px solid #dbe2ea;border-radius:14px}.brand{text-align:center;border-bottom:2px solid #14213d;padding-bottom:14px;margin-bottom:20px}.brand img{width:68px;height:68px;border-radius:50%}.brand h1{font-size:24px;margin:5px 0 0}.order-id{text-align:center;font-size:20px;font-weight:800;margin-bottom:20px}.details{width:100%;border-collapse:collapse;margin-bottom:18px}.details td{padding:6px 0;border-bottom:1px solid #edf0f4}.details td:last-child{text-align:right;font-weight:700}.items{width:100%;border-collapse:collapse;margin:18px 0}.items th{background:#14213d;color:#fff;padding:9px;text-align:left}.items td{border:1px solid #dbe2ea;padding:9px}.items .center,.items th.center{text-align:center}.items .right,.items th.right{text-align:right}.total{font-size:17px;font-weight:800;text-align:right}.footer{text-align:center;color:#64748b;font-size:12px;margin-top:24px}
  @media print{body{background:#fff}.toolbar{display:none}.order-card{max-width:none;margin:0;border:0;border-radius:0;padding:0;box-shadow:none}@page{margin:12mm}}
</style></head><body>
  <div class="toolbar"><button class="print-button" onclick="window.print()">Print Order Details</button></div>
  <article class="order-card">
    <div class="brand"><img src="/logo.png" alt="RailEats"><h1>RailEats Order</h1></div>
    <div class="order-id">#${escapeHtml(order.OrderId)}</div>
    <table class="details">
      <tr><td>Restaurant</td><td>${escapeHtml(order.RestroName || "—")}</td></tr>
      <tr><td>Customer</td><td>${escapeHtml(order.CustomerName || "—")}</td></tr>
      <tr><td>Mobile</td><td>${escapeHtml(order.CustomerMobile || "—")}</td></tr>
      <tr><td>Train</td><td>${escapeHtml(order.TrainNumber || "—")}</td></tr>
      <tr><td>Coach / Seat</td><td>${escapeHtml(order.Coach || "—")} / ${escapeHtml(order.Seat || "—")}</td></tr>
      <tr><td>Delivery</td><td>${escapeHtml(order.DeliveryDate || "—")} ${escapeHtml(order.DeliveryTime || "")}</td></tr>
      <tr><td>Payment</td><td>${escapeHtml(order.PaymentMode || "—")}</td></tr>
    </table>
    <table class="items"><thead><tr><th>Item</th><th class="center">Qty</th><th class="right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="total">Total: ₹${Number(order.TotalAmount || 0).toFixed(2)}</div>
    <div class="footer">Please prepare and deliver this order on time.</div>
  </article>
</body></html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function hidden(name: string, value: string) {
  return `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`;
}

export async function GET(request: NextRequest) {
  const token = text(request.nextUrl.searchParams.get("token"));
  const action = normalize(request.nextUrl.searchParams.get("action"));
  const payload = verifyVendorOrderActionToken(token);

  if (!payload || !["accept", "reject", "print"].includes(action)) {
    return errorPage("This secure order link is invalid or has expired.");
  }

  const { order, error } = await loadOrder(payload.orderId, payload.restroCode);
  if (error || !order) return errorPage("Order could not be found.", 404);

  if (action === "print") {
    const { items, error: itemsError } = await loadOrderItems(payload.orderId);
    if (itemsError) return errorPage("Order item details could not be loaded.", 500);
    return printPage(order, items);
  }

  if (normalize(order.Status) !== "neworder") {
    return page(
      "Order already processed",
      `<h1 style="margin-top:0">Order already processed</h1><p>Order <strong>#${escapeHtml(order.OrderId)}</strong> currently has status <strong>${escapeHtml(order.Status)}</strong>. No change was made.</p>`,
      "#64748b"
    );
  }

  const summary = `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:22px">
    <strong>#${escapeHtml(order.OrderId)}</strong><br>
    <span style="color:#64748b">${escapeHtml(order.CustomerName || "Customer")} · Train ${escapeHtml(order.TrainNumber || "—")}</span>
  </div>`;

  if (action === "accept") {
    return page(
      "Accept RailEats order",
      `<h1 style="margin-top:0">Accept order?</h1><p style="color:#64748b">Please confirm that your restaurant will prepare and deliver this order.</p>${summary}
      <form method="post">
        ${hidden("token", token)}${hidden("action", "accept")}
        <button type="submit" style="width:100%;border:0;border-radius:11px;padding:15px;background:#16a34a;color:#fff;font-size:17px;font-weight:800;cursor:pointer">Accept &amp; move to In Kitchen</button>
      </form>`,
      "#16a34a"
    );
  }

  const options = REJECTION_REASONS.map(
    (reason) => `<option value="${escapeHtml(reason)}">${escapeHtml(reason)}</option>`
  ).join("");

  return page(
    "Reject RailEats order",
    `<h1 style="margin-top:0">Reject order</h1><p style="color:#64748b">Select the reason. The order will move to Cancellation Request for review.</p>${summary}
    <form method="post">
      ${hidden("token", token)}${hidden("action", "reject")}
      <label style="display:block;font-weight:700;margin-bottom:7px">Primary reason</label>
      <select name="reason" required style="width:100%;box-sizing:border-box;padding:13px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font-size:15px">${options}</select>
      <label style="display:block;font-weight:700;margin:18px 0 7px">Remarks / details</label>
      <textarea name="remarks" rows="4" maxlength="500" placeholder="Add details for admin review" style="width:100%;box-sizing:border-box;padding:13px;border:1px solid #cbd5e1;border-radius:10px;font:15px Arial"></textarea>
      <button type="submit" style="width:100%;margin-top:20px;border:0;border-radius:11px;padding:15px;background:#dc2626;color:#fff;font-size:17px;font-weight:800;cursor:pointer">Submit Cancellation Request</button>
    </form>`,
    "#dc2626"
  );
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = text(form.get("token"));
  const action = normalize(form.get("action"));
  const reason = text(form.get("reason"));
  const remarks = text(form.get("remarks")).slice(0, 500);
  const payload = verifyVendorOrderActionToken(token);

  if (!payload || !["accept", "reject"].includes(action)) {
    return errorPage("This secure order link is invalid or has expired.");
  }
  if (action === "reject" && !REJECTION_REASONS.includes(reason as any)) {
    return errorPage("Please select a valid cancellation reason.");
  }

  const { order, error } = await loadOrder(payload.orderId, payload.restroCode);
  if (error || !order) return errorPage("Order could not be found.", 404);
  if (normalize(order.Status) !== "neworder") {
    return page(
      "Order already processed",
      `<h1 style="margin-top:0">Order already processed</h1><p>Current status: <strong>${escapeHtml(order.Status)}</strong>. No additional change was made.</p>`,
      "#64748b"
    );
  }

  const newStatus = action === "accept" ? "In Kitchen" : "Cancellation Request";
  const detail = action === "accept"
    ? "Order accepted by restaurant from email"
    : `Restaurant cancellation request: ${reason}${remarks ? ` — ${remarks}` : ""}`;
  const internalRequest = new NextRequest(
    new URL(`/api/orders/${encodeURIComponent(payload.orderId)}/status`, request.url),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newStatus,
        subStatus: action === "reject" ? reason : null,
        remarks: detail,
        note: detail,
        userType: "Restro",
        userName: order.RestroName || "Restaurant",
        actionSource: "Restro Email",
        restroCode: order.RestroCode,
        restroName: order.RestroName,
      }),
    }
  );

  const statusResponse = await updateOrderStatus(internalRequest, {
    params: { orderId: payload.orderId },
  });
  const result = await statusResponse.json().catch(() => ({}));

  if (!statusResponse.ok || result?.ok === false) {
    return errorPage(result?.message || result?.error || "Order status could not be updated.", statusResponse.status);
  }

  return action === "accept"
    ? page(
        "Order accepted",
        `<h1 style="margin-top:0;color:#15803d">Order accepted</h1><p>Order <strong>#${escapeHtml(payload.orderId)}</strong> is now <strong>In Kitchen</strong>.</p><p style="color:#64748b">Please prepare and deliver it on time.</p>`,
        "#16a34a"
      )
    : page(
        "Cancellation requested",
        `<h1 style="margin-top:0;color:#b91c1c">Cancellation request submitted</h1><p>Order <strong>#${escapeHtml(payload.orderId)}</strong> moved to <strong>Cancellation Request</strong>.</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p>${remarks ? `<p><strong>Details:</strong> ${escapeHtml(remarks)}</p>` : ""}`,
        "#dc2626"
      );
}
