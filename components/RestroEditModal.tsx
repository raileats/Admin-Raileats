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
  restro?: any;
  onClose?: () => void;
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

/* ---------- validators ---------- */
const emailRegex = /^\S+@\S+\.\S+$/;
const tenDigitRegex = /^\d{10}$/;

function validateEmailString(s: string) {
  if (!s) return false;
  return s
    .split(",")
    .map((p) => p.trim())
    .every((p) => emailRegex.test(p));
}

/* ---------- component ---------- */
export default function RestroEditModal({
  restro: restroProp,
  onClose,
  initialTab,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab ?? "Basic Information");
  const [local, setLocal] = useState<any>(restroProp ?? {});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------- helpers ---------- */
  const updateField = useCallback((key: string, value: any) => {
    setLocal((s: any) => ({ ...s, [key]: value }));
    setError(null);
  }, []);

  const isNewRestro = !local?.RestroCode;
  const isBasicTab = activeTab === "Basic Information";

  /* ---------- validation ---------- */
  const validationErrors = useMemo(() => {
    const errs: string[] = [];

    if (!local.RestroName) errs.push("Restro Name required");
    if (!local.StationCode) errs.push("Station required");

    return errs;
  }, [local]);

  const primaryContactValid = useMemo(() => {
    const email = (local.EmailsforOrdersReceiving1 ?? "").trim();
    const mobile = (local.WhatsappMobileNumberforOrderDetails1 ?? "")
      .replace(/\D/g, "");
    return (
      (email && validateEmailString(email)) ||
      (mobile && tenDigitRegex.test(mobile))
    );
  }, [local]);

  const saveDisabled =
    saving ||
    validationErrors.length > 0 ||
    (!isBasicTab && !primaryContactValid);

  /* ---------- SAVE ---------- */
  async function handleSave() {
    setError(null);
    setNotification(null);

    if (validationErrors.length) {
      setNotification({
        type: "error",
        text: validationErrors.join(", "),
      });
      return;
    }

    setSaving(true);
    try {
      let res: Response;

      if (isNewRestro) {
        // 👉 CREATE
        res = await fetch("/api/restrosmaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(local),
        });
      } else {
        // 👉 UPDATE
        res = await fetch("/api/restrosmaster", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...local,
            RestroCode: local.RestroCode,
          }),
        });
      }

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Save failed");

      setNotification({
        type: "success",
        text: isNewRestro
          ? `Restro created successfully (Code ${json.RestroCode})`
          : "Changes saved successfully",
      });

      if (isNewRestro && json?.RestroCode) {
        setLocal(json);
      }

      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function doClose() {
    onClose ? onClose() : router.push("/admin/restros");
  }

  const common = {
    local,
    updateField,
    Select,
    Toggle,
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;
      case "Station Settings":
        return <StationSettingsTab {...common} />;
      case "Address & Documents":
        return (
          <AddressDocsClient
            initialData={local}
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
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1100,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "98%",
          height: "98%",
          maxWidth: 1700,
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <strong>
            {local.RestroName || "New Restro"}{" "}
            {local.RestroCode ? `(#${local.RestroCode})` : ""}
          </strong>
          <button
            onClick={doClose}
            style={{ float: "right", background: "#ef4444", color: "#fff" }}
          >
            ✕
          </button>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
          {TAB_NAMES.map((t) => (
            <div
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: activeTab === t ? 700 : 500,
                borderBottom:
                  activeTab === t ? "3px solid #0ea5e9" : "none",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <AdminForm>{renderTab()}</AdminForm>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: 12,
            borderTop: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ color: "red" }}>{error}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <SecondaryButton onClick={doClose}>Cancel</SecondaryButton>
            <SubmitButton onClick={handleSave} disabled={saveDisabled}>
              {saving ? "Saving..." : "Save"}
            </SubmitButton>
          </div>
        </div>
      </div>
    </div>
  );
}
