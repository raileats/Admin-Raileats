"use client";

import React, { useState } from "react";

type Props = {
  restro: any;
  onClose: () => void;
};

const tabs = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

export default function RestroEditModal({ restro, onClose }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  if (!restro) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          width: "85vw",
          height: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {restro.RestroCode} / {restro.RestroName} / {restro.StationCode} /{" "}
            {restro.StationName}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 24,
            padding: "10px 16px",
            borderBottom: "1px solid #eee",
            overflowX: "auto",
          }}
        >
          {tabs.map((t) => (
            <div
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                cursor: "pointer",
                paddingBottom: 6,
                borderBottom: activeTab === t ? "2px solid #0ea5e9" : "none",
                color: activeTab === t ? "#0ea5e9" : "#333",
                fontWeight: activeTab === t ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>{activeTab}</h2>
          <p>
            Content for <b>{activeTab}</b> will go here.
          </p>
        </div>
      </div>
    </div>
  );
}
