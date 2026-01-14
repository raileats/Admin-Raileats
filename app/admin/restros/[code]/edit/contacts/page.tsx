'use client';

import React, { useEffect, useState } from 'react';

type Item = {
  id: string;
  name: string;
  value: string;
  active: boolean;
};

function makeEmpty(prefix: string, count: number): Item[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-${i + 1}`,
    name: '',
    value: '',
    active: false,
  }));
}

export default function ContactsClient({
  restroCode,
  initialEmails = [],
  initialWhatsapps = [],
}: {
  restroCode: string;
  initialEmails: Item[];
  initialWhatsapps: Item[];
}) {
  const [emails, setEmails] = useState<Item[]>([]);
  const [whatsapps, setWhatsapps] = useState<Item[]>([]);

  useEffect(() => {
    const emailBase = makeEmpty('email', 2);
    initialEmails.forEach((e, i) => {
      if (emailBase[i]) emailBase[i] = { ...emailBase[i], ...e };
    });
    setEmails(emailBase);

    const waBase = makeEmpty('wa', 3);
    initialWhatsapps.forEach((w, i) => {
      if (waBase[i]) waBase[i] = { ...waBase[i], ...w };
    });
    setWhatsapps(waBase);
  }, [initialEmails, initialWhatsapps]);

  const inputClass =
    'w-full min-h-[40px] px-3 py-2 bg-white border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500 relative z-10';

  return (
    <div className="space-y-12">

      {/* EMAILS */}
      <div>
        <h3 className="font-semibold mb-6">Emails (max 2)</h3>

        {emails.map((e, i) => (
          <div
            key={e.id}
            className="grid grid-cols-12 gap-4 mb-4 items-center"
          >
            <input
              type="text"
              placeholder={`Name ${i + 1}`}
              value={e.name}
              onChange={(ev) => {
                const v = [...emails];
                v[i].name = ev.target.value;
                setEmails(v);
              }}
              className={`col-span-4 ${inputClass}`}
            />

            <input
              type="email"
              placeholder={`Email ${i + 1}`}
              value={e.value}
              onChange={(ev) => {
                const v = [...emails];
                v[i].value = ev.target.value;
                setEmails(v);
              }}
              className={`col-span-6 ${inputClass}`}
            />

            <label className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={e.active}
                onChange={(ev) => {
                  const v = [...emails];
                  v[i].active = ev.target.checked;
                  setEmails(v);
                }}
              />
              <span className="text-sm">{e.active ? 'ON' : 'OFF'}</span>
            </label>
          </div>
        ))}
      </div>

      {/* WHATSAPP */}
      <div>
        <h3 className="font-semibold mb-6">WhatsApp numbers (max 3)</h3>

        {whatsapps.map((w, i) => (
          <div
            key={w.id}
            className="grid grid-cols-12 gap-4 mb-4 items-center"
          >
            <input
              type="text"
              placeholder={`Name ${i + 1}`}
              value={w.name}
              onChange={(ev) => {
                const v = [...whatsapps];
                v[i].name = ev.target.value;
                setWhatsapps(v);
              }}
              className={`col-span-4 ${inputClass}`}
            />

            <input
              type="text"
              placeholder={`Mobile ${i + 1}`}
              value={w.value}
              onChange={(ev) => {
                const v = [...whatsapps];
                v[i].value = ev.target.value.replace(/\D/g, '').slice(0, 10);
                setWhatsapps(v);
              }}
              className={`col-span-6 ${inputClass}`}
            />

            <label className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={w.active}
                onChange={(ev) => {
                  const v = [...whatsapps];
                  v[i].active = ev.target.checked;
                  setWhatsapps(v);
                }}
              />
              <span className="text-sm">{w.active ? 'ON' : 'OFF'}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
