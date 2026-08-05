# Restaurant order notifications

The order APIs send best-effort transactional email notifications to restaurant contacts through Resend.

## Configuration

- Set the server-only `RESEND_API_KEY` environment variable.
- Verify `raileats.in` in Resend so `RailEats Support <support@raileats.in>` can be used as the sender.
- Every message uses `support@raileats.in` as Reply-To.

## Recipient rules

Recipients come only from the restaurant's Contacts tab (`RestroMaster`):

- `EmailsforOrdersReceiving1` is included only when `EmailsforOrdersStatus1` is `ON`.
- `EmailsforOrdersReceiving2` is included only when `EmailsforOrdersStatus2` is `ON`.
- Invalid and duplicate email addresses are removed.
- `RestroEmail` from Basic Information is not used as a fallback.

WhatsApp notifications are disabled. The helper does not read WhatsApp contacts or call a WhatsApp provider.

## Events

- `POST /api/orders` sends a new-order email after the order, items, and initial journey work completes.
- `PATCH /api/orders/[orderId]/status` sends a status-update email after the order status and related server-side work completes.

Email delivery is best-effort: a missing key, no enabled recipients, contact lookup failure, or Resend failure is logged, but it does not roll back or fail an otherwise successful order operation. Notification details and restaurant email addresses are not exposed in order API responses.

## Operational checks

Confirm the `raileats.in` sending domain is verified in Resend and `RESEND_API_KEY` is present in every deployed server environment. Resend failures are available in server logs.
