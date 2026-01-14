import ContactsClient from './ContactsClient';

type Item = {
  id: string;
  name: string;
  value: string;
  active: boolean;
};

export default function Page({
  params,
}: {
  params: { code: string };
}) {
  const restroCode = params.code;

  // Abhi ke liye empty data
  // baad me yahan API call lagegi
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
