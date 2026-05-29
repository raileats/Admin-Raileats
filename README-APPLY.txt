Replace these files in Admin project:

1. components/tabs/BasicInfoClient.tsx
2. components/restro-route-tabs/StationSettingsClient.tsx
3. app/api/restros/[code]/route.ts
4. app/api/restrosmaster/route.ts
5. app/admin/restros/new/basic/page.tsx

Fixes:
- RestroPhone saves as exact RestroPhone column, as 10 digit text.
- OwnerPhone also saves as 10 digit text.
- IsPureVeg added to Basic Information in edit and new restro, saves to IsPureVeg column.
- Delivery Charge GST (absolute) continues to save to RaileatsCustomerDeliveryChargeGST.
- Removed Delivery Time (mins) and Delivery Radius (km) from Station Settings UI and API payload because columns are not in RestroMaster CSV.
- Removed non-existing DeliveryTime/DeliveryRadius update attempts from app/api/restros/[code]/route.ts.
