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

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          width: "92%",
          maxWidth: "1700px",
          height: "92%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderBottom: "1px solid #ddd",
            fontWeight: "bold",
          }}
        >
          <div>
            {restro.RestroCode} / {restro.RestroName} / {restro.StationCode} /{" "}
            {restro.StationName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Outlet Page Link */}
            <a
              href={`https://admin.raileats.in/admin/restros/edit/${restro.RestroCode}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0ea5e9", textDecoration: "underline", fontSize: 14 }}
            >
              Open Outlet Page
            </a>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
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
            borderBottom: "1px solid #ddd",
            background: "#f9f9f9",
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom:
                  activeTab === tab ? "3px solid #0ea5e9" : "3px solid transparent",
                fontWeight: activeTab === tab ? "bold" : "normal",
                color: activeTab === tab ? "#0ea5e9" : "#333",
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>{activeTab}</h2>
          <p>
            {/* Placeholder content */}
            Here you can implement forms and fields for{" "}
            <b>{activeTab}</b>.
          </p>
        </div>
      </div>
    </div>
  );
}
