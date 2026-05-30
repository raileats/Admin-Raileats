Replace these files in Admin project:

1. components/tabs/BasicInfoClient.tsx
2. app/api/restrosmaster/route.ts

Why this fix:
- Active Basic page already calls /api/restros/[code], but RestroPhone was still coming back blank in UI.
- BasicInfoClient now verifies RestroPhone after save.
- If primary /api/restros/[code] response does not contain saved RestroPhone, it performs a direct fallback PATCH to /api/restrosmaster with exact RestroPhone column.
- Then it reloads /api/restros/[code] with cache busting.
- It shows Saved successfully only if fresh row actually contains the same RestroPhone.
- app/api/restrosmaster/route.ts now also verifies RestroPhone and returns { ok, row } for PATCH.
