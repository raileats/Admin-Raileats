"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput } from "@/components/admin/AdminField";

type Item = {
  id: string;
  name: string;
  value: string;
  active: boolean;
};

type Props = {
  restroCode?: string | number;
  initialData?: any;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_RE = /^[6-9][0-9]{9}$/;

function cleanMobile(value: any) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

function makeEmpty(prefix: string, count: number): Item[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-${i + 1}`,
    name: "",
    value: "",
    active: false,
  }));
}

function isActive(value: any) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "on", "active", "yes"].includes(normalized);
}

function normalizeRows(row: any) {
  return {
    emails: [
      {
        id: "email-1",
        name: row?.EmailAddressName1 ?? "",
        value: row?.EmailsforOrdersReceiving1 ?? "",
        active: isActive(row?.EmailsforOrdersStatus1),
      },
      {
        id: "email-2",
        name: row?.EmailAddressName2 ?? "",
        value: row?.EmailsforOrdersReceiving2 ?? "",
        active: isActive(row?.EmailsforOrdersStatus2),
      },
    ],
    whatsapps: [
      {
        id: "wa-1",
        name: row?.WhatsappMobileNumberName1 ?? "",
        value: cleanMobile(row?.WhatsappMobileNumberforOrderDetails1),
        active: isActive(row?.WhatsappMobileNumberStatus1),
      },
      {
        id: "wa-2",
        name: row?.WhatsappMobileNumberName2 ?? "",
        value: cleanMobile(row?.WhatsappMobileNumberforOrderDetails2),
        active: isActive(row?.WhatsappMobileNumberStatus2),
      },
      {
        id: "wa-3",
        name: row?.WhatsappMobileNumberName3 ?? "",
        value: cleanMobile(row?.WhatsappMobileNumberforOrderDetails3),
        active: isActive(row?.WhatsappMobileNumberStatus3),
      },
    ],
  };
}

export default function ContactsClient({ restroCode, initialData = {} }: Props) {
  const router = useRouter();

  const code = useMemo(() => {
    if (restroCode) return String(restroCode);
    if (initialData?.RestroCode) return String(initialData.RestroCode);
    if (typeof window === "undefined") return "";

    try {
      return localStorage.getItem("new_restro_code") || "";
    } catch {
      return "";
    }
  }, [restroCode, initialData?.RestroCode]);

  const initialRows = normalizeRows(initialData);
  const [emails, setEmails] = useState<Item[]>(initialRows.emails.length ? initialRows.emails : makeEmpty("email", 2));
  const [whatsapps, setWhatsapps] = useState<Item[]>(initialRows.whatsapps.length ? initialRows.whatsapps : makeEmpty("wa", 3));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!code) return;

    let cancelled = false;

    async function loadContacts() {
      try {
        setLoading(true);
        setMessage("");

        const res = await fetch(`/api/restros/${encodeURIComponent(code)}/contacts`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || "Failed to load contacts");
        }

        if (!cancelled) {
          const rows = normalizeRows(json.row || {});
          setEmails(rows.emails);
          setWhatsapps(rows.whatsapps);
        }
      } catch (error: any) {
        if (!cancelled) setMessage(error?.message || "Failed to load contacts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadContacts();

    return () => {
      cancelled = true;
    };
  }, [code]);

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

  function validate() {
    const badEmail = emails.find((row) => row.value && !EMAIL_RE.test(row.value));
    if (badEmail) return "Please enter a valid email address.";

    const badMobile = whatsapps.find((row) => {
      const mobile = cleanMobile(row.value);
      return mobile && !INDIAN_MOBILE_RE.test(mobile);
    });
    if (badMobile) return "WhatsApp mobile number must be a valid 10 digit Indian mobile number.";

    return "";
  }

  async function save() {
    const validationError = validate();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    if (!code) {
      setMessage("Missing RestroCode. Please save Basic Information first.");
      return;
    }

    const payload = {
      EmailAddressName1: emails[0]?.name ?? "",
      EmailsforOrdersReceiving1: emails[0]?.value ?? "",
      EmailsforOrdersStatus1: emails[0]?.active ? "ON" : "OFF",
      EmailAddressName2: emails[1]?.name ?? "",
      EmailsforOrdersReceiving2: emails[1]?.value ?? "",
      EmailsforOrdersStatus2: emails[1]?.active ? "ON" : "OFF",
      WhatsappMobileNumberName1: whatsapps[0]?.name ?? "",
      WhatsappMobileNumberforOrderDetails1: cleanMobile(whatsapps[0]?.value) || null,
      WhatsappMobileNumberStatus1: whatsapps[0]?.active ? "ON" : "OFF",
      WhatsappMobileNumberName2: whatsapps[1]?.name ?? "",
      WhatsappMobileNumberforOrderDetails2: cleanMobile(whatsapps[1]?.value) || null,
      WhatsappMobileNumberStatus2: whatsapps[1]?.active ? "ON" : "OFF",
      WhatsappMobileNumberName3: whatsapps[2]?.name ?? "",
      WhatsappMobileNumberforOrderDetails3: cleanMobile(whatsapps[2]?.value) || null,
      WhatsappMobileNumberStatus3: whatsapps[2]?.active ? "ON" : "OFF",
    };

    try {
      setSaving(true);
      setMessage("");

      const res = await fetch(`/api/restros/${encodeURIComponent(code)}/contacts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Save failed");
      }

      const rows = normalizeRows(json.row || payload);
      setEmails(rows.emails);
      setWhatsapps(rows.whatsapps);
      setMessage("Saved successfully");
    } catch (error: any) {
      setMessage(error?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard
      title="Contacts"
      subtitle="Order notification email and WhatsApp recipients"
      actions={
        <>
          <AdminButton variant="secondary" onClick={() => router.back()}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save} disabled={saving || loading}>
            {saving ? "Saving..." : "Save"}
          </AdminButton>
        </>
      }
      bodyClassName="space-y-5"
    >
      {message ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            message.toLowerCase().includes("success")
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      ) : null}

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
                  onChange={(event) => updateEmail(index, "value", event.target.value.trim())}
                  className={row.value && EMAIL_RE.test(row.value) ? "border-emerald-400" : row.value ? "border-red-400" : ""}
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
                  inputMode="numeric"
                  value={row.value}
                  onChange={(event) =>
                    updateWhatsapp(
                      index,
                      "value",
                      cleanMobile(event.target.value)
                    )
                  }
                  className={row.value && INDIAN_MOBILE_RE.test(cleanMobile(row.value)) ? "border-emerald-400" : row.value ? "border-red-400" : ""}
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
    </AdminCard>
  );
}
