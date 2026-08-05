import { createVendorOrderActionToken } from "@/lib/vendorOrderActionToken";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const EMAIL_FROM = "RailEats Support <support@raileats.in>";
const EMAIL_REPLY_TO = "support@raileats.in";

type SendVendorOrderNotificationArgs = {
  supabase: any;
  order: Record<string, any>;
  items?: Array<Record<string, any>>;
};

export type VendorNotificationResult = {
  email: {
    attempted: boolean;
    sent: boolean;
    recipients: string[];
    id: string | null;
    warning: string | null;
  };
  whatsapp: {
    enabled: false;
  };
};

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

function isEnabled(value: unknown) {
  return ["1", "true", "on", "active", "yes"].includes(
    text(value).toLowerCase()
  );
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function orderValue(order: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    if (order?.[key] !== null && order?.[key] !== undefined) {
      return order[key];
    }
  }
  return null;
}

function money(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${amount.toFixed(2)}` : "—";
}

function itemRows(items: Array<Record<string, any>>) {
  if (items.length === 0) {
    return '<tr><td colspan="3" style="padding:8px;border:1px solid #ddd">Order item details unavailable</td></tr>';
  }

  return items
    .map((item) => {
      const name = orderValue(item, "ItemName", "item_name", "name") || "Item";
      const quantity = orderValue(item, "Quantity", "quantity", "qty") || 0;
      const total = orderValue(item, "LineTotal", "line_total");

      return `<tr>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(name)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${escapeHtml(quantity)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${escapeHtml(money(total))}</td>
      </tr>`;
    })
    .join("");
}

function publicBaseUrl() {
  const configured = text(
    process.env.VENDOR_NOTIFICATION_BASE_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL
  );

  if (!configured) return null;
  return configured.startsWith("http") ? configured.replace(/\/$/, "") : `https://${configured.replace(/\/$/, "")}`;
}

function buildEmail(
  order: Record<string, any>,
  items: Array<Record<string, any>>,
  actionUrl: string,
  logoUrl: string
) {
  const orderId = text(orderValue(order, "OrderId", "orderId", "id"));
  const restaurant = orderValue(order, "RestroName", "restroName") || "Restaurant Partner";
  const acceptUrl = `${actionUrl}&action=accept`;
  const rejectUrl = `${actionUrl}&action=reject`;
  const printUrl = `${actionUrl}&action=print`;

  return {
    subject: `New RailEats order ${orderId} — Please accept or reject`,
    html: `<!doctype html>
<html><body style="margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#14213d">
  <div style="display:none;max-height:0;overflow:hidden">New order ${escapeHtml(orderId)} is waiting for your response.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fb;padding:28px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(20,33,61,.10)">
      <tr><td style="background:#ffffff;padding:22px 28px;text-align:center;border-bottom:1px solid #e2e8f0">
        <img src="${escapeHtml(logoUrl)}" width="74" height="74" alt="RailEats" style="display:block;margin:0 auto 8px;border-radius:50%">
        <div style="font-size:28px;font-weight:800;color:#111827">RailEats</div>
        <div style="font-size:13px;font-weight:700;letter-spacing:1px;color:#4b5563">RESTAURANT ORDER ALERT</div>
      </td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 8px;font-size:25px;text-align:center">New order received</h1>
        <p style="margin:0 0 24px;text-align:center;color:#64748b">Hello ${escapeHtml(restaurant)}, please accept and deliver this order on time.</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:20px">
          <tr><td style="padding:18px">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:700">Order ID</div>
            <div style="font-size:19px;font-weight:800;margin:3px 0 14px">#${escapeHtml(orderId)}</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="4">
              <tr><td style="color:#64748b">Customer</td><td align="right" style="font-weight:700">${escapeHtml(orderValue(order, "CustomerName", "customerName") || "—")}</td></tr>
              <tr><td style="color:#64748b">Mobile</td><td align="right" style="font-weight:700">${escapeHtml(orderValue(order, "CustomerMobile", "customerMobile") || "—")}</td></tr>
              <tr><td style="color:#64748b">Train</td><td align="right" style="font-weight:700">${escapeHtml(orderValue(order, "TrainNumber", "trainNumber") || "—")}</td></tr>
              <tr><td style="color:#64748b">Coach / Seat</td><td align="right" style="font-weight:700">${escapeHtml(orderValue(order, "Coach", "coach") || "—")} / ${escapeHtml(orderValue(order, "Seat", "seat") || "—")}</td></tr>
              <tr><td style="color:#64748b">Delivery</td><td align="right" style="font-weight:700">${escapeHtml(orderValue(order, "DeliveryDate", "deliveryDate") || "—")} ${escapeHtml(orderValue(order, "DeliveryTime", "deliveryTime") || "")}</td></tr>
            </table>
          </td></tr>
        </table>

        <table style="width:100%;border-collapse:collapse;margin:0 0 18px">
          <thead><tr style="background:#14213d;color:#fff"><th style="padding:10px;text-align:left">Item</th><th style="padding:10px">Qty</th><th style="padding:10px;text-align:right">Amount</th></tr></thead>
          <tbody>${itemRows(items)}</tbody>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="5" style="font-size:16px;margin-bottom:22px">
          <tr><td>Payment: <strong>${escapeHtml(orderValue(order, "PaymentMode", "paymentMode") || "—")}</strong></td><td align="right">Total: <strong>${escapeHtml(money(orderValue(order, "TotalAmount", "totalAmount")))}</strong></td></tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
          <td width="49%"><a href="${escapeHtml(acceptUrl)}" style="display:block;background:#16a34a;color:#fff;text-decoration:none;text-align:center;padding:14px 8px;border-radius:10px;font-weight:800">ACCEPT ORDER</a></td>
          <td width="2%"></td>
          <td width="49%"><a href="${escapeHtml(rejectUrl)}" style="display:block;background:#dc2626;color:#fff;text-decoration:none;text-align:center;padding:14px 8px;border-radius:10px;font-weight:800">REJECT ORDER</a></td>
        </tr></table>
        <a href="${escapeHtml(printUrl)}" style="display:block;margin-top:12px;background:#14213d;color:#fff;text-decoration:none;text-align:center;padding:13px 8px;border-radius:10px;font-weight:800">PRINT ORDER</a>
        <p style="margin:18px 0 0;text-align:center;font-size:12px;color:#94a3b8">These secure links expire in 48 hours. For help, reply to support@raileats.in.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  };
}

function baseResult(): VendorNotificationResult {
  return {
    email: {
      attempted: false,
      sent: false,
      recipients: [],
      id: null,
      warning: null,
    },
    whatsapp: { enabled: false },
  };
}

export async function sendVendorOrderNotification({
  supabase,
  order,
  items,
}: SendVendorOrderNotificationArgs): Promise<VendorNotificationResult> {
  const result = baseResult();
  const restroCode = orderValue(order, "RestroCode", "restroCode", "restro_code");
  const orderId = text(orderValue(order, "OrderId", "orderId", "id"));

  if (!restroCode || !orderId) {
    result.email.warning = "Restaurant code or order id is missing";
    return result;
  }

  try {
    const { data: contacts, error: contactsError } = await supabase
      .from("RestroMaster")
      .select(
        "EmailsforOrdersReceiving1,EmailsforOrdersStatus1,EmailsforOrdersReceiving2,EmailsforOrdersStatus2"
      )
      .eq("RestroCode", restroCode)
      .maybeSingle();

    if (contactsError) {
      result.email.warning = `Restaurant contacts lookup failed: ${contactsError.message}`;
      return result;
    }

    result.email.recipients = Array.from(
      new Set(
        [1, 2]
          .filter((index) => isEnabled(contacts?.[`EmailsforOrdersStatus${index}`]))
          .map((index) => text(contacts?.[`EmailsforOrdersReceiving${index}`]).toLowerCase())
          .filter(isEmail)
      )
    );

    if (result.email.recipients.length === 0) {
      result.email.warning = "No enabled restaurant email recipients";
      return result;
    }

    const apiKey = text(process.env.RESEND_API_KEY);
    if (!apiKey) {
      result.email.warning = "RESEND_API_KEY is not configured";
      return result;
    }

    const baseUrl = publicBaseUrl();
    const actionToken = createVendorOrderActionToken(orderId, String(restroCode));
    if (!baseUrl || !actionToken) {
      result.email.warning = "Vendor action URL or signing secret is not configured";
      return result;
    }

    let notificationItems = items;
    if (!notificationItems) {
      const { data, error } = await supabase
        .from("OrderItems")
        .select("ItemName,Quantity,LineTotal")
        .eq("OrderId", orderId);

      if (error) {
        console.error("Order notification items lookup failed", { orderId, error });
      }
      notificationItems = data || [];
    }

    const actionUrl = `${baseUrl}/api/vendor-order-action?token=${encodeURIComponent(actionToken)}`;
    const email = buildEmail(
      order,
      notificationItems || [],
      actionUrl,
      `${baseUrl}/logo.png`
    );
    result.email.attempted = true;

    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `restaurant-new-order-${orderId}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        reply_to: EMAIL_REPLY_TO,
        to: result.email.recipients,
        subject: email.subject,
        html: email.html,
      }),
    });
    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      result.email.warning = text(responseBody?.message) || `Resend returned HTTP ${response.status}`;
      return result;
    }

    result.email.sent = true;
    result.email.id = text(responseBody?.id) || null;
    return result;
  } catch (error: any) {
    result.email.warning = error?.message || "Restaurant email notification failed";
    return result;
  }
}
