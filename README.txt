FULL REPLACEMENT FILES

1. app/admin/orders/page.tsx
2. app/api/orders/route.ts

FIXES
- Orders table now recognizes PPD, PREPAID, ONLINE, PAID ONLINE, UPI and similar prepaid values instead of checking only exact ONLINE.
- Order ID, customer mobile, outlet, station and train searches now query the API.
- Text search automatically searches in All tab and is not restricted by the default current-day date range.
- Clicking any status tab clears applied search filters, so records show immediately without browser refresh.
- Existing order details, status actions, realtime behavior and calculations remain unchanged.
