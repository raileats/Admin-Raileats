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
const PHONE_RE = /^[6-9][0-9]{9}$/;

function makeEmpty(prefix: string, count: number): Item[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: `${prefix}-${index + 1}`,
    name: "",
    value: "",
    active: false,
  }));
}

function digits(value: any) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

function isActive(value: any) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "on", "active", "yes"].includes(normalized);
}

function normalizeRows(row: any) {
  const emails = makeEmpty("email", 2);
  const whatsapps = makeEmpty("wa", 3);

  emails[0] = {
    id: "email-1",
    name: row?.EmailAddressName1 ?? "",
    value: row?.EmailsforOrdersReceiving1 ?? "",
    active: isActive(row?.EmailsforOrdersStatus1),
  };

  emails[1] = {
    id: "email-2",
    name: row?.EmailAddressName2 ?? "",
    value: row?.EmailsforOrdersReceiving2 ?? "",
    active: isActive(row?.EmailsforOrdersStatus2),
  };

  whatsapps[0] = {
    id: "wa-1",
    name: row?.WhatsappMobileNumberName1 ?? "",
    value: digits(row?.WhatsappMobileNumberforOrderDetails1),
    active: isActive(row?.WhatsappMobileNumberStatus1),
  };

  whatsapps[1] = {
    id: "wa-2",
    name: row?.WhatsappMobileNumberName2 ?? "",
    value: digits(row?.WhatsappMobileNumberforOrderDetails2),
    active: isActive(row?.WhatsappMobileNumberStatus2),
  };

  whatsapps[2] = {
    id: "wa-3",
    name: row?.WhatsappMobileNumberName3 ?? "",
    value: digits(row?.WhatsappMobileNumberforOrderDetails3),
    active: isActive(row?.WhatsappMobileNumberStatus3),
  };

  return { emails, whatsapps };
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex h-8 w-[82px] shrink-0 items-center rounded-full px-1 text-xs font-bold transition ${
        checked ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] shadow-sm transition ${
          checked ? "translate-x-[50px] text-blue-600" : "translate-x-0 text-slate-400"
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>

      <span className={`flex-1 text-center ${checked ? "-translate-x-5" : "translate-x-1"}`}>
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}

export default function ContactsClient({
  restroCode,
  initialData = {},
}: Props) {
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

  const [emails, setEmails] = useState<Item[]>(initialRows.emails);
  const [whatsapps, setWhatsapps] = useState<Item[]>(initialRows.whatsapps);
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
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      )
    );
  }

  function updateWhatsapp(index: number, key: keyof Item, value: string | boolean) {
    setWhatsapps((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      )
    );
  }

  function validate() {
    const badEmail = emails.find(
      (row) => row.value.trim() && !EMAIL_RE.test(row.value.trim())
    );

    if (badEmail) return "Please enter a valid email address.";

    const badMobile = whatsapps.find(
      (row) => row.value.trim() && !PHONE_RE.test(digits(row.value))
    );

    if (badMobile) {
      return "WhatsApp mobile number must be exactly 10 digits and start with 6-9.";
    }

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
      EmailAddressName1: emails[0]?.name?.trim() ?? "",
      EmailsforOrdersReceiving1: emails[0]?.value?.trim() ?? "",
      EmailsforOrdersStatus1: emails[0]?.active ? "ON" : "OFF",

      EmailAddressName2: emails[1]?.name?.trim() ?? "",
      EmailsforOrdersReceiving2: emails[1]?.value?.trim() ?? "",
      EmailsforOrdersStatus2: emails[1]?.active ? "ON" : "OFF",

      WhatsappMobileNumberName1: whatsapps[0]?.name?.trim() ?? "",
      WhatsappMobileNumberforOrderDetails1: digits(whatsapps[0]?.value) || null,
      WhatsappMobileNumberStatus1: whatsapps[0]?.active ? "ON" : "OFF",

      WhatsappMobileNumberName2: whatsapps[1]?.name?.trim() ?? "",
      WhatsappMobileNumberforOrderDetails2: digits(whatsapps[1]?.value) || null,
      WhatsappMobileNumberStatus2: whatsapps[1]?.active ? "ON" : "OFF",

      WhatsappMobileNumberName3: whatsapps[2]?.name?.trim() ?? "",
      WhatsappMobileNumberforOrderDetails3: digits(whatsapps[2]?.value) || null,
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

      const freshRes = await fetch(
  `/api/restros/${encodeURIComponent(code)}/contacts?t=${Date.now()}`,
  { cache: "no-store" }
);

const freshJson = await freshRes.json().catch(() => ({}));

const rows = normalizeRows(freshJson?.row || json.row || payload);

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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AdminCard title="Emails" subtitle="Up to 2 email recipients">
          <div className="space-y-4">
            {emails.map((row, index) => (
              <div
                key={row.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900">
                    Email {index + 1}
                  </div>

                  <ToggleSwitch
                    checked={row.active}
                    onChange={(value) => updateEmail(index, "active", value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.8fr_1.2fr]">
                  <AdminField label="Name">
                    <AdminInput
                      placeholder={`Name ${index + 1}`}
                      value={row.name}
                      onChange={(event) =>
                        updateEmail(index, "name", event.target.value)
                      }
                    />
                  </AdminField>

                  <AdminField label="Email">
                    <AdminInput
                      placeholder={`Email ${index + 1}`}
                      value={row.value}
                      onChange={(event) =>
                        updateEmail(index, "value", event.target.value.trim())
                      }
                      className={
                        row.value && EMAIL_RE.test(row.value)
                          ? "border-emerald-400"
                          : row.value
                          ? "border-red-400"
                          : ""
                      }
                    />
                  </AdminField>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="WhatsApp Numbers" subtitle="Up to 3 mobile recipients">
          <div className="space-y-4">
            {whatsapps.map((row, index) => (
              <div
                key={row.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900">
                    WhatsApp Mobile {index + 1}
                  </div>

                  <ToggleSwitch
                    checked={row.active}
                    onChange={(value) =>
                      updateWhatsapp(index, "active", value)
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.8fr_1.2fr]">
                  <AdminField label="Name">
                    <AdminInput
                      placeholder={`Name ${index + 1}`}
                      value={row.name}
                      onChange={(event) =>
                        updateWhatsapp(index, "name", event.target.value)
                      }
                    />
                  </AdminField>

                  <AdminField label="Mobile">
                    <AdminInput
                      name={`WhatsappMobileNumberforOrderDetails${index + 1}`}
                      placeholder={`Mobile ${index + 1}`}
                      inputMode="numeric"
                      maxLength={10}
                      value={row.value}
                      onChange={(event) =>
                        updateWhatsapp(index, "value", digits(event.target.value))
                      }
                      className={
                        row.value && PHONE_RE.test(row.value)
                          ? "border-emerald-400"
                          : row.value
                          ? "border-red-400"
                          : ""
                      }
                    />
                  </AdminField>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminCard>
  );
}
