"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import UI from "@/components/AdminUI";

import BasicInformationTab from "./restro-edit/BasicInformationTab";
import StationSettingsTab from "./restro-edit/StationSettingsTab";
import AddressDocumentsTab from "./restro-edit/AddressDocumentsTab";
import ContactsTab from "./restro-edit/ContactsTab";
import BankTab from "./restro-edit/BankTab";
import FutureClosedTab from "./restro-edit/FutureClosedTab";
import MenuTab from "./restro-edit/MenuTab";

const { AdminForm, SubmitButton, SecondaryButton, Select, Toggle } = UI;

/* ✅ ALL TABS BACK */
const TAB_NAMES = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

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

export default function RestroEditModal({
  restro: restroProp,
  onClose,
  initialTab = "Basic Information",
}: any) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [local, setLocal] = useState<any>({});
  const [stations, setStations] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<any>(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (restroProp) {
      setLocal({ ...restroProp });
    }
  }, [restroProp]);

  /* ================= STATIONS ================= */
  useEffect(() => {
    async function fetchStations() {
      try {
        const res = await fetch("/api/stations");

        if (!res.ok) return;

        const json = await res.json();
        const rows = json?.rows || json?.data || json || [];

        setStations(
          rows.map((r: any) => ({
            value: r.StationCode,
            label: `${r.StationName} (${r.StationCode})${
              r.State ? ` - ${r.State}` : ""
            }`,
          }))
        );
      } catch (e) {
        console.error("Stations error", e);
      }
    }

    fetchStations();
  }, []);

  /* ================= UPDATE ================= */
  const updateField = useCallback((key: string, value: any) => {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const restroCode = local?.RestroCode;
  const stationDisplay = buildStationDisplay(local);

  /* ================= SAVE ================= */
  async function handleSave() {
    try {
      setSaving(true);
      setNotification(null);

      if (!restroCode) throw new Error("Missing RestroCode");

      const payload = {
        RestroName: local?.RestroName || null,
        OwnerName: local?.OwnerName || null,
        OwnerEmail: local?.OwnerEmail || null,
        OwnerPhone: local?.OwnerPhone || null,
        RestroEmail: local?.RestroEmail || null,
        RestroPhone: local?.RestroPhone || null,
        BrandNameifAny: local?.BrandName || null,
        RestroRating: local?.RestroRating || null,

        IsIrctcApproved: local?.IsIrctcApproved || null,
        RaileatsStatus: local?.RaileatsStatus ? 1 : 0,

        WeeklyOff: local?.WeeklyOff || null,
        open_time: local?.OpenTime || null,
        closed_time: local?.ClosedTime || null,

        MinimumOrderValue: local?.MinimumOrderValue || null,
        CutOffTime: local?.CutOffTime || null,
      };

      const res = await fetch(`/api/restros/${restroCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Update failed");
      }

      setNotification({
        type: "success",
        text: "Saved successfully ✅",
      });

      router.refresh();
    } catch (e: any) {
      setNotification({
        type: "error",
        text: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  const common = {
    local,
    updateField,
    restroCode,
    stationDisplay,
    stations,
    Select,
    Toggle,
  };

  /* ✅ ALL TAB RENDER BACK */
  function renderTab() {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;
      case "Station Settings":
        return <StationSettingsTab {...common} />;
      case "Address & Documents":
        return <AddressDocumentsTab {...common} />;
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[98%] h-[98%] flex flex-col">

        <div className="flex gap-4 border-b px-6 py-3">
          {TAB_NAMES.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={activeTab === t ? "text-blue-600 font-bold" : ""}
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

        <div className="p-4 flex justify-end gap-3">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <SubmitButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </SubmitButton>
        </div>

      </div>
    </div>
  );
}
