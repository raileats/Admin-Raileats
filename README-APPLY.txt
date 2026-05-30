Replace these files in Admin project:

1. components/tabs/ContactsClient.tsx
2. app/api/restros/[code]/contacts/route.ts

Current Admin zip deep-read notes:
- Active edit/new contacts pages import components/tabs/ContactsClient.tsx.
- app/admin/restros/[code]/edit/contacts/ContactsClient.tsx is an unused old duplicate; do not use it.
- Status fields saved only on Save button click, not instantly.
- Status values save as ON/OFF for EmailsforOrdersStatus1, EmailsforOrdersStatus2, WhatsappMobileNumberStatus1, WhatsappMobileNumberStatus2, WhatsappMobileNumberStatus3.
- No EmailsforOrdersStatus3 column is used because current RestroMaster schema has only 2 email slots.
- UI is compact: left Emails, right WhatsApp, with blue ON / grey OFF sliders.
