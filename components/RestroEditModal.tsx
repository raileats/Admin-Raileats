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

const { AdminForm, SubmitButton, SecondaryButton } = UI;

type Props = {
  restro?: any;
  onClose?: () => void;
  onSave?: (payload: any) => Promise<{ ok: boolean; row?: any; error?: any }>;
  saving?: boolean;
  stationsOptions?: { label: string; value: string }[];
  initialTab?: string;
};

const TAB_NAMES = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

/* ---------- helpers ---------- */
function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (!obj) continue;
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null)
      return obj[k];
  }
  return undefined;
}

function buildStationDisplay(obj: any) {
  const sName = (safeGet(obj, "StationName") ?? "").toString().trim();
  const sCode = (safeGet(obj, "StationCode") ?? "").toString().trim();
  const state = (safeGet(obj, "State") ?? "").toString().trim();
  let txt = "";
  if (sName) txt += sName;
  if (sCode) txt += ` (${sCode})`;
  if (state) txt += ` - ${state}`;
  return txt || "—";
}

/* ---------- validators ---------- */
const emailRegex = /^\S+@\S+\.\S+$/;
const tenDigitRegex = /^\d{10}$/;

function validateEmailString(s: string) {
  if (!s) return false;
  return s.split(",").every((p) => emailRegex.test(p.trim()));
}

export default function RestroEditModal({
  restro: restroProp,
  onClose,
  saving: parentSaving,
  stationsOptions = [],
  initialTab,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab ?? "Basic Information");
  const [restro, setRestro] = useState<any | undefined>(restroProp);
  const [local, setLocal] = useState<any>({});
  const [stations] = useState(stationsOptions);
  const [savingInternal, setSavingInternal] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const saving = parentSaving ?? savingInternal;

  useEffect(() => {
    if (restroProp) setRestro(restroProp);
  }, [restroProp]);

  useEffect(() => {
    if (!restro) return;
    setLocal({ ...restro });
  }, [restro]);

  const updateField = useCallback((k: string, v: any) => {
    setLocal((s: any) => ({ ...s, [k]: v }));
    setError(null);
    setNotification(null);
  }, []);

  const stationDisplay = buildStationDisplay({ ...restro, ...local });

  const restroCode =
    local?.RestroCode ??
    restro?.RestroCode ??
    "";

  /* ---------- VALIDATION FIX ---------- */
  const validationErrors = useMemo(() => {
    if (!local.RestroName) return ["Restro Name required"];
    if (!local.StationCode) return ["Station required"];
    return [];
  }, [local]);

  const primaryContactValid = useMemo(() => {
    const email = (local.EmailsforOrdersReceiving1 ?? "").trim();
    const mobile = (local.WhatsappMobileNumberforOrderDetails1 ?? "").replace(/\D/g, "");
    return validateEmailString(email) || tenDigitRegex.test(mobile);
  }, [local]);

  const isBasicTab = activeTab === "Basic Information";

  const saveDisabled =
    saving ||
    validationErrors.length > 0 ||
    (!isBasicTab && !primaryContactValid);

  /* ---------- SAVE HANDLER (POST + PATCH) ---------- */
  async function handleSave() {
    setSavingInternal(true);
    setError(null);

    try {
      let res;
      let json;

      if (!restroCode) {
        // 🔥 CREATE NEW RESTRO
        res = await fetch("/api/restrosmaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(local),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Create failed");
        setLocal(json);
        setRestro(json);
      } else {
        // ✏️ UPDATE EXISTING
        res = await fetch(`/api/restros/${restroCode}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(local),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Update failed");
      }

      setNotification({ type: "success", text: "Saved successfully ✅" });
      setTimeout(() => router.refresh?.(), 800);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingInternal(false);
    }
  }

  const common = {
    local,
    updateField,
    stationDisplay,
    stations,
    restroCode,
  };

  const renderTab = () => {
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
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[1100] flex items-center justify-center p-4">
      <div className="bg-white w-[98%] h-[98%] rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex justify-between">
          <div>
            <div className="font-bold">
              {local.RestroCode || "NEW"} — {local.RestroName || ""}
            </div>
            <div className="text-sm text-sky-700">{stationDisplay}</div>
          </div>
          <button onClick={onClose} className="bg-red-500 text-white px-3 rounded">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-4 border-b overflow-x-auto">
          {TAB_NAMES.map((t) => (
            <div
              key={t}
              onClick={() => setActiveTab(t)}
              className={`cursor-pointer py-2 ${
                activeTab === t ? "border-b-2 border-sky-500 font-bold" : ""
              }`}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          <AdminForm>{renderTab()}</AdminForm>
        </div>

        {/* Footer */}
        <div className="border-t p-3 flex justify-between items-center">
          <div className="text-red-600 text-sm">
            {validationErrors[0]}
            {!isBasicTab && !primaryContactValid && " | Contact required"}
            {error}
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <SubmitButton disabled={saveDisabled} onClick={handleSave}>
              {saving ? "Saving..." : "Save"}
            </SubmitButton>
          </div>
        </div>
      </div>
    </div>
  );
}
