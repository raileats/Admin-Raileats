Replace these files in Admin project:

1. components/tabs/BasicInfoClient.tsx
2. components/restro-route-tabs/StationSettingsClient.tsx
3. app/api/restros/[code]/route.ts
4. app/api/restrosmaster/route.ts
5. app/admin/restros/new/basic/page.tsx

Fixes:
- Basic RestroPhone is sent as exact RestroPhone column and UI no longer force-refreshes/clears after save.
- Station Settings Delivery Charge GST (absolute) is sent as exact RaileatsCustomerDeliveryChargeGST column.
- API now fetches fresh Supabase row after PATCH and verifies RestroPhone and RaileatsCustomerDeliveryChargeGST actually persisted.
- If either field does not save in Supabase, API returns error instead of fake success.
- IsPureVeg remains in Basic Information and saves to exact IsPureVeg column.
- Delivery Time and Delivery Radius are not included because they are not in RestroMaster CSV/schema.
