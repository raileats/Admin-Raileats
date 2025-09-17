"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  restro: any;
  onClose: () => void;
};

const TABS = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

export default function RestroEditModal({ restro, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // trap focus into modal
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!restro) return null;

  const restroCode = restro.RestroCode ?? restro.RestroId ?? "";

  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div
      ref={backdropRef}
      onMouseDown={onBackdropClick}
      aria-modal="true"
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="document"
        style={{
          background: "#fff",
          borderRadius: 8,
          width: "92%",
          maxWidth: "1700px",
          height: "92%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            borderBottom: "1px solid #e9e9e9",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>
            {restroCode} / {restro.RestroName ?? "-"} / {restro.StationCode ?? "-"} /{" "}
            {restro.StationName ?? "-"}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a
              href={`https://admin.raileats.in/admin/restros/edit/${restroCode}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#0ea5e9",
                textDecoration: "none",
                fontWeight: 600,
                background: "transparent",
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid rgba(14,165,233,0.12)",
                cursor: "pointer",
              }}
            >
              Open Outlet Page
            </a>

            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                padding: 6,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 18,
            padding: "12px 18px",
            borderBottom: "1px solid #f0f0f0",
            overflowX: "auto",
            alignItems: "center",
            background: "#fff",
          }}
        >
          {TABS.map((t) => {
            const active = t === activeTab;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "8px 6px",
                  cursor: "pointer",
                  color: active ? "#0ea5e9" : "#333",
                  fontWeight: active ? 700 : 500,
                  borderBottom: active ? "3px solid #0ea5e9" : "3px solid transparent",
                  outline: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
          {/* You can replace these placeholders with real forms/components */}
          {activeTab === "Basic Information" && (
            <section>
              <h3 style={{ marginTop: 0 }}>Basic Information</h3>
              <p style={{ color: "#444" }}>
                Content for <strong>Basic Information</strong> will go here.
              </p>

              {/* Example quick preview */}
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: "#666" }}>Restro Code</label>
                  <div style={{ marginTop: 6, fontWeight: 600 }}>{restroCode}</div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#666" }}>Restro Name</label>
                  <div style={{ marginTop: 6 }}>{restro.RestroName ?? "-"}</div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#666" }}>Station Code</label>
                  <div style={{ marginTop: 6 }}>{restro.StationCode ?? "-"}</div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#666" }}>Station Name</label>
                  <div style={{ marginTop: 6 }}>{restro.StationName ?? "-"}</div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "Station Settings" && (
            <section>
              <h3 style={{ marginTop: 0 }}>Station Settings</h3>
              <p style={{ color: "#444" }}>Content for <strong>Station Settings</strong> will go here.</p>
            </section>
          )}

          {activeTab === "Address & Documents" && (
            <section>
              <h3 style={{ marginTop: 0 }}>Address & Documents</h3>
              <p style={{ color: "#444" }}>Upload / view documents and address details here.</p>
            </section>
          )}

          {activeTab === "Contacts" && (
            <section>
              <h3 style={{ marginTop: 0 }}>Contacts</h3>
              <p style={{ color: "#444" }}>Contact person, phone, email etc.</p>
            </section>
          )}

          {activeTab === "Bank" && (
            <section>
              <h3 style={{ marginTop: 0 }}>Bank</h3>
              <p style={{ color: "#444" }}>Bank account details, IFSC etc.</p>
            </section>
          )}

          {activeTab === "Future Closed" && (
            <section>
              <h3 style={{ marginTop: 0 }}>Future Closed</h3>
              <p style={{ color: "#444" }}>Manage future closed dates / holidays.</p>
            </section>
          )}

          {activeTab === "Menu" && (
            <section>
              <h3 style={{ marginTop: 0 }}>Menu</h3>
              <p style={{ color: "#444" }}>Menu management (link to menu editor or inline UI).</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
