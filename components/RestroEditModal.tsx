"use client";

import React, { useState } from "react";

type Props = {
  restro: any;
  onClose: () => void;
  isPage?: boolean; // ✅ नया prop
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

export default function RestroEditModal({ restro, onClose, isPage }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div
      style={{
        position: isPage ? "relative" : "fixed", // ✅ Page mode vs Modal
        top: isPage ? "0" : "0",
        left: isPage ? "0" : "0",
        width: isPage ? "100%" : "100%",
        height: isPage ? "100%" : "100%",
        background: isPage ? "#fff" : "rgba(0,0,0,0.5)", // ✅ Page mode में overlay नहीं होगा
        display: "flex",
        justifyContent: "center",
        alignItems: isPage ? "flex-start" : "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: isPage ? 0 : 8,
          width: isPage ? "100%" : "92%",
          maxWidth: isPage ? "100%" : "1700px",
          height: isPage ? "100%" : "92%",
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
              href={`/admin/restros/edit/${restro.RestroCode}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0ea5e9", textDecoration: "underline", fontSize: 14 }}
            >
              Open Outlet Page
            </a>

            {/* Close button (Page mode में नहीं दिखेगा) */}
            {!isPage && (
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
            )}
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
