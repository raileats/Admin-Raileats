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

export default function ContactsClient() {
  const [emails, setEmails] = useState<Item[]>([]);
  const [whatsapps, setWhatsapps] = useState<Item[]>([]);

  useEffect(() => {
    setEmails(makeEmpty('email', 2));
    setWhatsapps(makeEmpty('wa', 3));
  }, []);

  // 🔥 RailEats Admin CSS Breaker
  const inputStyle: React.CSSProperties = {
    ...( { all: 'unset' } as React.CSSProperties ),
    boxSizing: 'border-box',
    width: '100%',
    height: '44px',
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: '14px',
    cursor: 'text',
    pointerEvents: 'auto',
    display: 'block',
  };

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 120px',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '14px',
  };

  return (
    <div style={{ paddingBottom: 30 }}>

      <h3 style={{ fontWeight: 600, marginBottom: 16 }}>
        Emails (max 2)
      </h3>

      {emails.map((e, i) => (
        <div key={e.id} style={rowStyle}>
          <input
            style={inputStyle}
            placeholder={`Name ${i + 1}`}
            value={e.name}
            onChange={(ev) => {
              const v = [...emails];
              v[i].name = ev.target.value;
              setEmails(v);
            }}
          />

          <input
            style={inputStyle}
            placeholder={`Email ${i + 1}`}
            value={e.value}
            onChange={(ev) => {
              const v = [...emails];
              v[i].value = ev.target.value;
              setEmails(v);
            }}
          />

          <label style={{ display: 'flex', gap: 6 }}>
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

      <h3 style={{ fontWeight: 600, marginBottom: 16 }}>
        WhatsApp numbers (max 3)
      </h3>

      {whatsapps.map((w, i) => (
        <div key={w.id} style={rowStyle}>
          <input
            style={inputStyle}
            placeholder={`Name ${i + 1}`}
            value={w.name}
            onChange={(ev) => {
              const v = [...whatsapps];
              v[i].name = ev.target.value;
              setWhatsapps(v);
            }}
          />

          <input
            style={inputStyle}
            placeholder={`Mobile ${i + 1}`}
            value={w.value}
            onChange={(ev) => {
              const v = [...whatsapps];
              v[i].value = ev.target.value.replace(/\D/g, '').slice(0, 10);
              setWhatsapps(v);
            }}
          />

          <label style={{ display: 'flex', gap: 6 }}>
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
