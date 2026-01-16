"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import UI from "@/components/AdminUI";
import BasicInformationTab from "./restro-edit/BasicInformationTab";
import StationSettingsTab from "./restro-edit/StationSettingsTab";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import ContactsTab from "./restro-edit/ContactsTab";
import BankTab from "./restro-edit/BankTab";
import FutureClosedTab from "./restro-edit/FutureClosedTab";
import MenuTab from "./restro-edit/MenuTab";

const {
  AdminForm,
  SubmitButton,
  SecondaryButton,
  Select,
  Toggle,
} = UI;

/* ================= TABS ================= */
const TAB_NAMES = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

/* ================= HELPERS ================= */
const emailRegex = /^\S+@\S+\.\S+$/;
const tenDigitRegex = /^\d{10}$/;

function validateEmailString(s: string) {
  if (!s) return false;
  return s.split(",").every((e) => emailRegex.test(e.trim()));
}

/* ================= COMPONENT ================= */
function RestroEditModal({
  restro: restroProp,
  onClose,
  initialTab = "Basic Information",
}: any) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [restro, setRestro] = useState<any>(restroProp);
  const [local, setLocal] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<any>(null);

  /* ===== INIT LOCAL STATE ===== */
  useEffect(() => {
    if (restroProp) {
      setRestro(restroProp);
      setLocal({ ...restroProp });
    }
  }, [restroProp]);

  /* ===== FIELD UPDATE (NO TYPING BUG) ===== */
  const updateField = useCallback((key: string, value: any) => {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  /* ===== PATCH API ===== */
  async function defaultPatch(payload: any) {
    const code = restro?.RestroCode;
    if (!code) throw new Error("Missing RestroCode");

    const res = await fetch(`/api/restros/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error || "Update failed");
    }
    return json;
  }

  /* ================= SAVE ================= */
  async function handleSave() {
    setSaving(true);
    setNotification(null);

    try {
      const allowed = [
        "EmailAddressName1",
        "EmailsforOrdersReceiving1",
        "EmailsforOrdersStatus1",
        "EmailAddressName2",
        "EmailsforOrdersReceiving2",
        "EmailsforOrdersStatus2",
        "WhatsappMobileNumberName1",
        "WhatsappMobileNumberforOrderDetails1",
        "WhatsappMobileNumberStatus1",
        "WhatsappMobileNumberName2",
        "WhatsappMobileNumberforOrderDetails2",
        "WhatsappMobileNumberStatus2",
        "WhatsappMobileNumberName3",
        "WhatsappMobileNumberforOrderDetails3",
        "WhatsappMobileNumberStatus3",
      ];

      const payload: any = {};

      for (const k of allowed) {
        let v = local[k];

        if (typeof v === "string") v = v.trim();

        if (
          k.toLowerCase().includes("whatsapp") &&
          k.toLowerCase().includes("orderdetails")
        ) {
          v = String(v ?? "").replace(/\D/g, "").slice(0, 10);
        }

        payload[k] = v ?? null;
      }

      // 🔥 SUPABASE UPDATE
      await defaultPatch(payload);

      setNotification({
        type: "success",
        text: "Contacts saved successfully ✅",
      });

      setActiveTab("Station Settings");
      router.refresh?.();
    } catch (err: any) {
      console.error("Save error:", err);
      setNotification({
        type: "error",
        text: err?.message || "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  /* ================= COMMON PROPS ================= */
  const common = {
    local,
    updateField,
    Select,
    Toggle,
  };

  /* ================= RENDER TAB ================= */
  function renderTab() {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;
      case "Station Settings":
        return <StationSettingsTab {...common} />;
      case "Address & Documents":
        return <AddressDocsClient initialData={restro} />;
      case "Contacts":
        return <ContactsTab {...common} />;
      case "Bank":
        return <BankTab {...common} />;
      case "Future Closed":
        return <FutureClosedTab {...common} />;
      case "Menu":
        return <MenuTab {...common} />;
      default:
        return null;
    }
  }

  /* ================= JSX ================= */
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40">
      <div className="bg-white w-[98%] h-[98%] rounded-lg flex flex-col">
        {/* TABS */}
        <div className="flex gap-4 border-b px-6 py-3">
          {TAB_NAMES.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-2 font-semibold ${
                activeTab === t
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : ""
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* NOTIFICATION */}
        {notification && (
          <div
            className={`text-center py-2 font-semibold ${
              notification.type === "error"
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {notification.text}
          </div>
        )}

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-6">
          <AdminForm>{renderTab()}</AdminForm>
        </div>

        {/* FOOTER */}
        <div className="border-t p-4 flex justify-end gap-3">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <SubmitButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}

export default RestroEditModal;
