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

const { AdminForm, SubmitButton, SecondaryButton, Select, Toggle } = UI;

const TAB_NAMES = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

/* ---------------- helpers ---------------- */
function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return "";
}

function buildStationDisplay(obj: any) {
  const name = safeGet(obj, "StationName");
  const code = safeGet(obj, "StationCode");
  const state = safeGet(obj, "State");
  return `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`;
}

/* ---------------- component ---------------- */
export default function RestroEditModal({
  restro: restroProp,
  onClose,
  initialTab = "Basic Information",
}: any) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [restro, setRestro] = useState<any>(restroProp);
  const [local, setLocal] = useState<any>({});

  /* 🔥 STATION STATE (THIS WAS MISSING) */
  const [stations, setStations] = useState<{ label: string; value: string }[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<any>(null);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    if (restroProp) {
      setRestro(restroProp);
      setLocal({ ...restroProp });
    }
  }, [restroProp]);

  /* ---------------- FETCH STATIONS (🔥 REQUIRED) ---------------- */
  useEffect(() => {
    async function fetchStations() {
      setLoadingStations(true);
      try {
        const res = await fetch("/api/stations");
        if (!res.ok) return;

        const json = await res.json();
        const rows = json?.rows || json?.data || json || [];

        const opts = rows.map((r: any) => ({
          value: r.StationCode,
          label: `${r.StationName} (${r.StationCode})${r.State ? ` - ${r.State}` : ""}`,
        }));

        setStations(opts);
      } catch (err) {
        console.error("Stations fetch failed", err);
      } finally {
        setLoadingStations(false);
      }
    }

    fetchStations();
  }, []);

  /* ---------------- UPDATE FIELD ---------------- */
  const updateField = useCallback((key: string, value: any) => {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const restroCode = local?.RestroCode || restro?.RestroCode || "";
  const stationDisplay = buildStationDisplay({ ...restro, ...local });

  /* ---------------- SAVE ---------------- */
  async function handleSave() {
    try {
      setSaving(true);
      setNotification(null);

      const res = await fetch(`/api/restros/${restroCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Save failed");

      setNotification({ type: "success", text: "Saved successfully ✅" });
      router.refresh();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- COMMON PROPS ---------------- */
  const common = {
    local,
    updateField,
    restroCode,
    stationDisplay,
    stations,          // ✅ FIX
    loadingStations,   // ✅ FIX
    Select,
    Toggle,
  };

  function renderTab() {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;

      case "Station Settings":
        return <StationSettingsTab {...common} />;

      case "Address & Documents":
        return (
          <AddressDocsClient
            initialData={restro}
            imagePrefix={process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""}
          />
        );

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

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 bg-black/40 z-[1100] flex items-center justify-center">
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
