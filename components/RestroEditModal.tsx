"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import UI from "@/components/AdminUI";

import BasicInformationTab from "./restro-edit/BasicInformationTab";
import StationSettingsTab from "./restro-edit/StationSettingsTab";
import AddressDocumentsTab from "./restro-edit/AddressDocumentsTab";
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

/* ================= CONSTANTS ================= */
const TAB_NAMES = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

/* ================= HELPERS (MERGED SAFE) ================= */
function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function buildStationDisplay(obj: any) {
  const name = (safeGet(obj, "StationName", "station_name") ?? "").toString().trim();
  const code = (safeGet(obj, "StationCode", "station_code") ?? "").toString().trim();
  const state = (safeGet(obj, "State", "state") ?? "").toString().trim();
  let out = name;
  if (code) out += ` (${code})`;
  if (state) out += ` - ${state}`;
  return out || "—";
}

const emailRegex = /^\S+@\S+\.\S+$/;
const tenDigitRegex = /^\d{10}$/;

/* ================= COMPONENT ================= */
export default function RestroEditModal({
  restro: restroProp,
  onClose,
  initialTab = TAB_NAMES[0],
}: any) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [restro, setRestro] = useState<any>(restroProp);
  const [local, setLocal] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /* ================= INIT ================= */
  useEffect(() => {
    if (restroProp) {
      setRestro(restroProp);
      setLocal({ ...restroProp });
    }
  }, [restroProp]);

  /* ================= ESC CLOSE ================= */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") doClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ================= RESTRO CODE ================= */
  const restroCode =
    local?.RestroCode ??
    restro?.RestroCode ??
    restro?.restro_code ??
    "";

  const isNewRestro = !restroCode;

  const stationDisplay = buildStationDisplay({ ...restro, ...local });

  /* ================= UPDATE FIELD ================= */
  const updateField = useCallback((key: string, value: any) => {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
    setError(null);
    setNotification(null);
  }, []);

  /* ================= PATCH API ================= */
  async function defaultPatch(payload: any) {
    const code = restroCode;
    if (!code) throw new Error("Missing RestroCode");

    const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new Error(json?.error || text || "Update failed");
    }
    return json;
  }

  /* ================= SAVE ================= */
  async function handleSave() {
    setSaving(true);
    setNotification(null);

    try {
      /* ----- CONTACTS PAYLOAD (OLD + NEW SAFE) ----- */
      const allowed = [
        "EmailAddressName1","EmailsforOrdersReceiving1","EmailsforOrdersStatus1",
        "EmailAddressName2","EmailsforOrdersReceiving2","EmailsforOrdersStatus2",
        "WhatsappMobileNumberName1","WhatsappMobileNumberforOrderDetails1","WhatsappMobileNumberStatus1",
        "WhatsappMobileNumberName2","WhatsappMobileNumberforOrderDetails2","WhatsappMobileNumberStatus2",
        "WhatsappMobileNumberName3","WhatsappMobileNumberforOrderDetails3","WhatsappMobileNumberStatus3",
      ];

      const payload: any = {};
      for (const k of allowed) {
        let v = local[k];
        if (typeof v === "string") v = v.trim();
        if (k.toLowerCase().includes("whatsapp") && k.toLowerCase().includes("orderdetails")) {
          v = String(v ?? "").replace(/\D/g, "").slice(0, 10);
        }
        payload[k] = v ?? null;
      }

      /* ----- CREATE NEW RESTRO (13 JAN + NEW MERGE) ----- */
      if (isNewRestro) {
        const createPayload = {
          RestroName: local.RestroName,
          StationCode: local.StationCode,
          StationName: local.StationName,
          OwnerName: local.OwnerName,
          OwnerEmail: local.OwnerEmail,
          OwnerPhone: local.OwnerPhone,
          RestroEmail: local.RestroEmail,
          RestroPhone: local.RestroPhone,
          BrandNameifAny: local.BrandName || null,
          RaileatsStatus: local.RaileatsStatus ? 1 : 0,
          IsIrctcApproved: local.IsIrctcApproved === "Yes" ? 1 : 0,
        };

        const res = await fetch("/api/restrosmaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Create failed");

        setRestro(json);
        setLocal((s: any) => ({ ...s, ...json }));
        setActiveTab("Station Settings");
      } else {
        await defaultPatch(payload);
      }

      setNotification({ type: "success", text: "Saved successfully ✅" });
      router.refresh();
    } catch (err: any) {
      setNotification({ type: "error", text: err?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  /* ================= COMMON PROPS ================= */
  const common = {
    local,
    updateField,
    restroCode,
    stationDisplay,
    Select,
    Toggle,
  };

  /* ================= TAB RENDER ================= */
  function renderTab() {
    switch (activeTab) {
      case "Basic Information": return <BasicInformationTab {...common} />;
      case "Station Settings": return <StationSettingsTab {...common} />;
      case "Address & Documents":
        return isNewRestro
          ? <AddressDocumentsTab {...common} />
          : <AddressDocsClient initialData={restro} />;
      case "Contacts": return <ContactsTab {...common} />;
      case "Bank": return <BankTab {...common} />;
      case "Future Closed": return <FutureClosedTab {...common} />;
      case "Menu": return <MenuTab {...common} />;
      default: return null;
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
                activeTab === t ? "border-b-2 border-blue-500 text-blue-600" : ""
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {notification && (
          <div className="text-center py-2 font-semibold">
            {notification.text}
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
          <AdminForm>{renderTab()}</AdminForm>
        </div>

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
