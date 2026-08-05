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

## Event and duplicate protection

- Email is sent only when an order transitions into `New Order`.
- No email is sent for `In Verification`, `In Kitchen`, or other status changes.
- Repeated updates that leave an order in `New Order` are ignored.
- The Resend idempotency key `restaurant-new-order-{OrderId}` prevents duplicate delivery retries for 24 hours.

## Email actions

- The branded email uses a clean white logo header and includes a structured order card plus Accept, Reject, and Print buttons.
- Accept opens a confirmation screen and then moves the order to `In Kitchen` through the existing status workflow.
- Reject opens the restaurant cancellation-reason form. Submitting it moves the order to `Cancellation Request` with the selected reason and remarks.
- Print opens a secure print-friendly view. Its print stylesheet includes only the order details card and removes the toolbar and page background.
- Action links are signed, bound to the order and restaurant, expire after 48 hours, and work only while the order is still `New Order`.
- Link scanners cannot change an order because GET requests only render forms; the mutation requires a POST confirmation.

Email delivery is best-effort: a missing key, no enabled recipients, contact lookup failure, or Resend failure is logged, but it does not roll back or fail an otherwise successful order operation. Notification details and restaurant email addresses are not exposed in order API responses.

## Operational checks

Confirm the `raileats.in` sending domain is verified in Resend and `RESEND_API_KEY` is present in every deployed server environment. The action-link base URL uses `VENDOR_NOTIFICATION_BASE_URL`, `NEXT_PUBLIC_ADMIN_URL`, or Vercel's production URL (in that order). Set `VENDOR_NOTIFICATION_SECRET` for dedicated signing; the existing Supabase service-role secret is used as a fallback. Resend failures are available in server logs.
