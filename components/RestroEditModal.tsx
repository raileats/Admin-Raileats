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

type Props = {
  restro?: any | null;          // ⭐ null = ADD NEW
  onClose?: () => void;
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

/* ---------- helpers (UNCHANGED) ---------- */
function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (!obj) continue;
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function buildStationDisplay(obj: any) {
  const sName = (safeGet(obj, "StationName") ?? "").toString().trim();
  const sCode = (safeGet(obj, "StationCode") ?? "").toString().trim();
  const state = (safeGet(obj, "State") ?? "").toString().trim();
  const parts: string[] = [];
  if (sName) parts.push(sName);
  if (sCode) parts.push(`(${sCode})`);
  let left = parts.join(" ");
  if (left && state) left = `${left} - ${state}`;
  return left || "—";
}

/* ---------- validators (UNCHANGED) ---------- */
const emailRegex = /^\S+@\S+\.\S+$/;
const tenDigitRegex = /^\d{10}$/;

function validateEmailString(s: string) {
  if (!s) return false;
  return s.split(",").every((p) => emailRegex.test(p.trim()));
}

/* ---------- component ---------- */
export default function RestroEditModal({
  restro: restroProp,
  onClose,
  saving: parentSaving,
  stationsOptions = [],
  initialTab,
}: Props) {
  const router = useRouter();

  const isNewRestro = !restroProp; // ⭐⭐ MAIN ADD

  const [activeTab, setActiveTab] = useState(initialTab ?? TAB_NAMES[0]);
  const [restro, setRestro] = useState<any | null>(restroProp ?? null);
  const [local, setLocal] = useState<any>({});
  const [stations, setStations] = useState(stationsOptions);
  const [savingInternal, setSavingInternal] = useState(false);

  /* ---------- INIT ---------- */
  useEffect(() => {
    if (isNewRestro) {
      setLocal({
        RestroName: "",
        StationCode: "",
        StationName: "",
        State: "",
        OwnerName: "",
        OwnerPhone: "",
        WeeklyOff: "SUN",
        OpenTime: "10:00",
        ClosedTime: "23:00",
        OrdersPaymentOptionForCustomer: "BOTH",
        IRCTCOrdersPaymentOptionForCustomer: "BOTH",
      });
    } else if (restroProp) {
      setRestro(restroProp);
      setLocal(restroProp);
    }
  }, [isNewRestro, restroProp]);

  /* ---------- STATIONS (UNCHANGED) ---------- */
  useEffect(() => {
    if (stations.length) return;
    fetch("/api/stations")
      .then((r) => r.json())
      .then((rows) => {
        const opts = rows.map((r: any) => ({
          label: `${r.StationName} (${r.StationCode}) - ${r.State}`,
          value: r.StationCode,
          ...r,
        }));
        setStations(opts);
      });
  }, []);

  const updateField = useCallback((k: string, v: any) => {
    setLocal((s: any) => ({ ...s, [k]: v }));
  }, []);

  const saving = parentSaving ?? savingInternal;

  /* ---------- SAVE (ADD + EDIT) ---------- */
  async function handleSave() {
    try {
      setSavingInternal(true);

      // 🔹 ADD NEW RESTRO
      if (isNewRestro) {
        if (!local.RestroName || !local.StationCode) {
          alert("Restro Name & Station required");
          return;
        }

        const lastRes = await fetch("/api/restromaster?last=1");
        const last = await lastRes.json();
        const nextCode = Number(last?.RestroCode ?? 1000) + 1;

        const payload = {
          ...local,
          RestroCode: nextCode,
        };

        const res = await fetch("/api/restromaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Create failed");

        router.push(`/admin/restros/${nextCode}/edit`);
        return;
      }

      // 🔹 EDIT EXISTING (UNCHANGED FLOW)
      await fetch(`/api/restros/${local.RestroCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
      });

      router.refresh?.();
    } finally {
      setSavingInternal(false);
    }
  }

  const common = {
    local,
    updateField,
    stations,
    stationDisplay: buildStationDisplay(local),
    restroCode: local.RestroCode,
    Select,
    Toggle,
    validators: { validateEmailString },
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;
      case "Station Settings":
        return <StationSettingsTab {...common} />;
      case "Address & Documents":
        return <AddressDocsClient initialData={local} />;
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
    <div className="fixed inset-0 bg-black/40 z-[1100] flex items-center justify-center">
      <div className="bg-white w-[98%] h-[98%] rounded-lg flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between px-6 py-3 border-b">
          <div>
            <div className="font-bold">
              {isNewRestro ? "Add New Restro" : `${local.RestroCode} ${local.RestroName}`}
            </div>
            <div className="text-sm text-cyan-700">
              {buildStationDisplay(local)}
            </div>
          </div>
          <button onClick={onClose} className="bg-red-500 text-white px-3 py-1 rounded">✕</button>
        </div>

        {/* TABS */}
        <div className="flex gap-6 px-6 border-b bg-gray-50">
          {TAB_NAMES.map((t) => (
            <div
              key={t}
              onClick={() => setActiveTab(t)}
              className={`py-3 cursor-pointer ${
                activeTab === t ? "border-b-2 border-sky-500 font-bold text-sky-600" : ""
              }`}
            >
              {t}
            </div>
          ))}
        </div>

        {/* BODY */}
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
