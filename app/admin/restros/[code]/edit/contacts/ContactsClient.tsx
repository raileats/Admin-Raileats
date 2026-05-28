"use client";

import { useEffect, useState } from "react";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput } from "@/components/admin/AdminField";

type Item = {
  id: string;
  name: string;
  value: string;
  active: boolean;
};

function makeEmpty(prefix: string, count: number): Item[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-${i + 1}`,
    name: "",
    value: "",
    active: false,
  }));
}

export default function ContactsClient() {
  const [emails, setEmails] = useState<Item[]>([]);
  const [whatsapps, setWhatsapps] = useState<Item[]>([]);

  useEffect(() => {
    setEmails(makeEmpty("email", 2));
    setWhatsapps(makeEmpty("wa", 3));
  }, []);

  function updateEmail(index: number, key: keyof Item, value: string | boolean) {
    setEmails((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  }

  function updateWhatsapp(index: number, key: keyof Item, value: string | boolean) {
    setWhatsapps((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  }

  return (
    <div className="space-y-5">
      <AdminCard title="Emails" subtitle="Up to 2 email recipients for order notifications">
        <div className="space-y-4">
          {emails.map((row, index) => (
            <div key={row.id} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr_140px] lg:items-end">
              <AdminField label={`Name ${index + 1}`}>
                <AdminInput
                  placeholder={`Name ${index + 1}`}
                  value={row.name}
                  onChange={(event) => updateEmail(index, "name", event.target.value)}
                />
              </AdminField>

              <AdminField label={`Email ${index + 1}`}>
                <AdminInput
                  placeholder={`Email ${index + 1}`}
                  value={row.value}
                  onChange={(event) => updateEmail(index, "value", event.target.value)}
                />
              </AdminField>

              <label className="flex h-10 items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={(event) => updateEmail(index, "active", event.target.checked)}
                />
                {row.active ? "ON" : "OFF"}
              </label>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="WhatsApp Numbers" subtitle="Up to 3 mobile recipients for order notifications">
        <div className="space-y-4">
          {whatsapps.map((row, index) => (
            <div key={row.id} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr_140px] lg:items-end">
              <AdminField label={`Name ${index + 1}`}>
                <AdminInput
                  placeholder={`Name ${index + 1}`}
                  value={row.name}
                  onChange={(event) => updateWhatsapp(index, "name", event.target.value)}
                />
              </AdminField>

              <AdminField label={`Mobile ${index + 1}`}>
                <AdminInput
                  placeholder={`Mobile ${index + 1}`}
                  value={row.value}
                  onChange={(event) =>
                    updateWhatsapp(
                      index,
                      "value",
                      event.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                />
              </AdminField>

              <label className="flex h-10 items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={(event) => updateWhatsapp(index, "active", event.target.checked)}
                />
                {row.active ? "ON" : "OFF"}
              </label>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
