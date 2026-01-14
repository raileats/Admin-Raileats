'use client';

import { useEffect, useState } from 'react';

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

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '42px',
  padding: '8px 12px',
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  outline: 'none',
  appearance: 'auto',
};

export default function ContactsClient({
  restroCode,
  initialEmails,
  initialWhatsapps,
}: {
  restroCode: string;
  initialEmails: Item[];
  initialWhatsapps: Item[];
}) {
  const [emails, setEmails] = useState<Item[]>([]);
  const [whatsapps, setWhatsapps] = useState<Item[]>([]);

  useEffect(() => {
    setEmails(makeEmpty('email', 2));
    setWhatsapps(makeEmpty('wa', 3));
  }, []);

  return (
    <div style={{ paddingBottom: 20 }}>

      {/* EMAILS */}
      <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Emails (max 2)</h3>

      {emails.map((e, i) => (
        <div
          key={e.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 120px',
            gap: 16,
            marginBottom: 14,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder={`Name ${i + 1}`}
            value={e.name}
            style={inputStyle}
            onChange={(ev) => {
              const v = [...emails];
              v[i].name = ev.target.value;
              setEmails(v);
            }}
          />

          <input
            type="email"
            placeholder={`Email ${i + 1}`}
            value={e.value}
            style={inputStyle}
            onChange={(ev) => {
              const v = [...emails];
              v[i].value = ev.target.value;
              setEmails(v);
            }}
          />

          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={e.active}
              onChange={(ev) => {
                const v = [...emails];
                v[i].active = ev.target.checked;
                setEmails(v);
              }}
            />
            <span>{e.active ? 'ON' : 'OFF'}</span>
          </label>
        </div>
      ))}

      <hr style={{ margin: '24px 0' }} />

      {/* WHATSAPP */}
      <h3 style={{ fontWeight: 600, marginBottom: 16 }}>
        WhatsApp numbers (max 3)
      </h3>

      {whatsapps.map((w, i) => (
        <div
          key={w.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 120px',
            gap: 16,
            marginBottom: 14,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder={`Name ${i + 1}`}
            value={w.name}
            style={inputStyle}
            onChange={(ev) => {
              const v = [...whatsapps];
              v[i].name = ev.target.value;
              setWhatsapps(v);
            }}
          />

          <input
            type="text"
            placeholder={`Mobile ${i + 1}`}
            value={w.value}
            style={inputStyle}
            onChange={(ev) => {
              const v = [...whatsapps];
              v[i].value = ev.target.value.replace(/\D/g, '').slice(0, 10);
              setWhatsapps(v);
            }}
          />

          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={w.active}
              onChange={(ev) => {
                const v = [...whatsapps];
                v[i].active = ev.target.checked;
                setWhatsapps(v);
              }}
            />
            <span>{w.active ? 'ON' : 'OFF'}</span>
          </label>
        </div>
      ))}
    </div>
  );
}
