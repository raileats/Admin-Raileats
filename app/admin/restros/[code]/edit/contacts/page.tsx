import ContactsClient from './ContactsClient';

type Item = {
  id: string;
  name: string;
  value: string;
  active: boolean;
};

export default async function Page({
  params,
}: {
  params: { code: string };
}) {
  const restroCode = params.code;

  // 🔹 TEMP: empty data (API later connect kar sakte ho)
  const initialEmails: Item[] = [];
  const initialWhatsapps: Item[] = [];

  return (
    <ContactsClient
      restroCode={restroCode}
      initialEmails={initialEmails}
      initialWhatsapps={initialWhatsapps}
    />
  );
}
