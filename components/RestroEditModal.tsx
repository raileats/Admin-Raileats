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
  const [restro, setRestro] = useState<any>(restroProp);
  const [local, setLocal] = useState<any>({});

  const [stations, setStations] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingStations, setLoadingStations] = useState(false);

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (restroProp) {
      setRestro(restroProp);
      setLocal({ ...restroProp });
    }
  }, [restroProp]);

  useEffect(() => {
    async function fetchStations() {
      try {
        const res = await fetch("/api/stations");
        const json = await res.json();
        const rows = json?.rows || json || [];
        setStations(
          rows.map((r: any) => ({
            value: r.StationCode,
            label: `${r.StationName} (${r.StationCode})`,
          }))
        );
      } catch {}
    }
    fetchStations();
  }, []);

  const updateField = useCallback((key: string, value: any) => {
    setLocal((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const restroCode = local?.RestroCode || restro?.RestroCode || "";

  async function handleSave() {
    try {
      setSaving(true);
      setNotification(null);

      const payload: any = {};

      const setIf = (k: string, v: any) => {
        if (v !== undefined && v !== "") payload[k] = v;
      };

      // ✅ BASIC INFO
      setIf("RestroName", local.RestroName);
      setIf("OwnerName", local.OwnerName);
      setIf("OwnerEmail", local.OwnerEmail);
      setIf("OwnerPhone", local.OwnerPhone);
      setIf("RestroEmail", local.RestroEmail);
      setIf("RestroPhone", local.RestroPhone);
      setIf("BrandNameifAny", local.BrandName);
      setIf("RestroRating", local.RestroRating);

      // ✅ STATUS
      setIf("IsIrctcApproved", local.IsIrctcApproved);
      setIf("RaileatsStatus", local.RaileatsStatus);

      // ✅ SETTINGS
      setIf("WeeklyOff", local.WeeklyOff);
      setIf("open_time", local.OpenTime);
      setIf("closed_time", local.ClosedTime);
      setIf("MinimumOrderValue", local.MinimumOrderValue);
      setIf("CutOffTime", local.CutOffTime);

      console.log("FINAL CLEAN PAYLOAD:", payload);

      const res = await fetch(
        `/api/admin/restros/${restroCode}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

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
      console.error(e);
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
    stations,
    loadingStations,
    Select,
    Toggle,
  };

  function renderTab() {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;
      case "Station Settings":
        return <StationSettingsTab {...common} />;
      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[98%] h-[98%] flex flex-col">
        
        <div className="flex gap-4 border-b px-6 py-3">
          {TAB_NAMES.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {notification && (
          <div className="text-center py-2">{notification.text}</div>
        )}

        <div className="flex-1 overflow-auto p-6">
          <AdminForm>{renderTab()}</AdminForm>
        </div>

        <div className="p-4 flex justify-end gap-3">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <SubmitButton onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
