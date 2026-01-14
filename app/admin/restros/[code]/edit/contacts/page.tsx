'use client';
import React, { useState } from 'react';

type Item = {
  id: string;
  name: string;
  value: string;
  active: boolean;
};

export default function ContactsClient({
  restroCode,
  initialEmails = [],
  initialWhatsapps = [],
}: {
  restroCode: string;
  initialEmails: Item[];
  initialWhatsapps: Item[];
}) {
  const [emails, setEmails] = useState<Item[]>(initialEmails);
  const [whatsapps, setWhatsapps] = useState<Item[]>(initialWhatsapps);

  function updateEmail(i: number, key: keyof Item, val: any) {
    setEmails(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  }

  function updateWhatsapp(i: number, key: keyof Item, val: any) {
    setWhatsapps(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  }

  return (
    <div className="space-y-10">

      {/* EMAILS */}
      <div>
        <h3 className="font-semibold mb-4">Emails (max 2)</h3>

        {emails.map((e, i) => (
          <div key={e.id} className="grid grid-cols-3 gap-4 mb-4 items-center">
            <input
              placeholder={`Name ${i + 1}`}
              value={e.name}
              onChange={(ev) => updateEmail(i, 'name', ev.target.value)}
              className="border p-2 rounded"
            />

            <input
              placeholder={`Email ${i + 1}`}
              value={e.value}
              onChange={(ev) => updateEmail(i, 'value', ev.target.value)}
              className="border p-2 rounded"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={e.active}
                onChange={(ev) => updateEmail(i, 'active', ev.target.checked)}
              />
              <span>{e.active ? 'ON' : 'OFF'}</span>
            </label>
          </div>
        ))}
      </div>

      {/* WHATSAPP */}
      <div>
        <h3 className="font-semibold mb-4">WhatsApp numbers (max 3)</h3>

        {whatsapps.map((w, i) => (
          <div key={w.id} className="grid grid-cols-3 gap-4 mb-4 items-center">
            <input
              placeholder={`Name ${i + 1}`}
              value={w.name}
              onChange={(ev) => updateWhatsapp(i, 'name', ev.target.value)}
              className="border p-2 rounded"
            />

            <input
              placeholder={`Mobile ${i + 1}`}
              value={w.value}
              onChange={(ev) =>
                updateWhatsapp(i, 'value', ev.target.value.replace(/\D/g, '').slice(0, 10))
              }
              className="border p-2 rounded"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={w.active}
                onChange={(ev) => updateWhatsapp(i, 'active', ev.target.checked)}
              />
              <span>{w.active ? 'ON' : 'OFF'}</span>
            </label>
          </div>
        ))}
      </div>

    </div>
  );
}
