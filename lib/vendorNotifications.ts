const RESEND_ENDPOINT = "https://api.resend.com/emails";
const EMAIL_FROM = "RailEats Support <support@raileats.in>";
const EMAIL_REPLY_TO = "support@raileats.in";

type NotificationEvent = "order_created" | "status_changed";

type SendVendorOrderNotificationArgs = {
  supabase: any;
  order: Record<string, any>;
  event: NotificationEvent;
  previousStatus?: string | null;
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

function buildEmail(
  order: Record<string, any>,
  event: NotificationEvent,
  previousStatus: string | null,
  items: Array<Record<string, any>>
) {
  const orderId = text(orderValue(order, "OrderId", "orderId", "id"));
  const status = text(orderValue(order, "Status", "OrderStatus", "status")) || "Booked";
  const heading = event === "order_created" ? "New restaurant order" : "Restaurant order status updated";
  const subject = event === "order_created"
    ? `New RailEats order ${orderId}`
    : `RailEats order ${orderId} status: ${status}`;
  const statusChange = event === "status_changed"
    ? `<p><strong>Status:</strong> ${escapeHtml(previousStatus || "—")} → ${escapeHtml(status)}</p>`
    : `<p><strong>Status:</strong> ${escapeHtml(status)}</p>`;

  return {
    subject,
    html: `<!doctype html>
<html><body style="font-family:Arial,sans-serif;color:#172033;line-height:1.5">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <h2 style="margin:0 0 16px">${heading}</h2>
    <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
    ${statusChange}
    <p><strong>Restaurant:</strong> ${escapeHtml(orderValue(order, "RestroName", "restroName") || "—")}</p>
    <p><strong>Customer:</strong> ${escapeHtml(orderValue(order, "CustomerName", "customerName") || "—")} (${escapeHtml(orderValue(order, "CustomerMobile", "customerMobile") || "—")})</p>
    <p><strong>Train / Seat:</strong> ${escapeHtml(orderValue(order, "TrainNumber", "trainNumber") || "—")} / ${escapeHtml(orderValue(order, "Coach", "coach") || "—")}-${escapeHtml(orderValue(order, "Seat", "seat") || "—")}</p>
    <p><strong>Delivery:</strong> ${escapeHtml(orderValue(order, "DeliveryDate", "deliveryDate") || "—")} ${escapeHtml(orderValue(order, "DeliveryTime", "deliveryTime") || "")}</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:left">Item</th><th style="padding:8px;border:1px solid #ddd">Qty</th><th style="padding:8px;border:1px solid #ddd;text-align:right">Amount</th></tr></thead>
      <tbody>${itemRows(items)}</tbody>
    </table>
    <p><strong>Total:</strong> ${escapeHtml(money(orderValue(order, "TotalAmount", "totalAmount")))}</p>
    <p><strong>Payment:</strong> ${escapeHtml(orderValue(order, "PaymentMode", "paymentMode") || "—")}</p>
    <p style="margin-top:24px;color:#5b6473">For help, reply to this email or contact support@raileats.in.</p>
  </div>
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
  event,
  previousStatus = null,
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

    const email = buildEmail(order, event, previousStatus, notificationItems || []);
    result.email.attempted = true;

    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
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
