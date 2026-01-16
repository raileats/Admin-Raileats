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

const TAB_NAMES = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

export default function RestroEditModal({
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

  /* ================= INIT ================= */
  useEffect(() => {
    if (restroProp) {
      setRestro(restroProp);
      setLocal({ ...restroProp });
    }
  }, [restroProp]);

  /* ================= REQUIRED ID ================= */
  const restroCode =
    local?.RestroCode ||
    restro?.RestroCode ||
    restro?.restro_code ||
    "";

  /* ================= UPDATE FIELD ================= */
  const updateField = useCallback((key: string, value: any) => {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  /* ================= API PATCH ================= */
  async function defaultPatch(payload: any) {
    if (!restroCode) {
      throw new Error("Missing RestroCode");
    }

    const res = await fetch(`/api/restros/${restroCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
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

      // 🔥🔥🔥 MAIN FIX — ACTUAL SUPABASE CALL
      await defaultPatch(payload);

      setNotification({
        type: "success",
        text: "Contacts saved successfully ✅",
      });

      setActiveTab("Station Settings");
      router.refresh();
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
    restroCode, // 🔥 REQUIRED — FIXES BUILD ERROR
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

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1100]">
      <div className="bg-white w-[98%] h-[98%] rounded-lg flex flex-col">
        {/* Tabs */}
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

        {/* Notification */}
        {notification && (
          <div className="text-center py-2 font-semibold">
            {notification.text}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <AdminForm>{renderTab()}</AdminForm>
        </div>

        {/* Footer */}
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
