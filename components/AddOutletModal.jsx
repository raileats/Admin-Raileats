// components/AddOutletModal.jsx
"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import so StationSearch only runs on client (avoid SSR issues)
const StationSearch = dynamic(() => import("./StationSearch"), { ssr: false });

export default function AddOutletModal({ stations = [], onClose = () => {}, onCreate = () => {} }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [basic, setBasic] = useState({
    outletId: "",
    outletName: "",
    stationId: "",
    stationObj: null,
    ownerName: "",
    outletLat: "",
    outletLong: "",
    ownerMobile: "",
    ownerEmail: "",
    outletMobile: "",
    outletStatus: true,
  });

  const [stationSettings, setStationSettings] = useState({
    openTime: "",
    closeTime: "",
    minOrder: "",
    cutOffMinutes: "",
  });

  const [documents, setDocuments] = useState({
    fssai: "",
    licenceFile: null,
  });

  function resetAll() {
    setBasic({
      outletId: "",
      outletName: "",
      stationId: "",
      stationObj: null,
      ownerName: "",
      outletLat: "",
      outletLong: "",
      ownerMobile: "",
      ownerEmail: "",
      outletMobile: "",
      outletStatus: true,
    });
    setStationSettings({ openTime: "", closeTime: "", minOrder: "", cutOffMinutes: "" });
    setDocuments({ fssai: "", licenceFile: null });
    setTab(0);
    setErrorMsg("");
  }

  async function handleBasicSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg("");

    // validation
    if (!basic.outletName || !basic.stationId || !basic.ownerMobile) {
      setErrorMsg("Please fill required fields: Outlet Name, Station and Owner Mobile.");
      return;
    }

    setLoading(true);
    try {
      // temporary generated id to continue flow; replace with server call if needed
      const fakeId = "OUT" + Math.floor(Math.random() * 900000 + 100000);
      setBasic((b) => ({ ...b, outletId: fakeId }));
      setTab(1);
    } catch (err) {
      console.error("handleBasicSubmit:", err);
      setErrorMsg("Error creating outlet (basic). See console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const payload = {
        basic: { ...basic },
        stationSettings,
        documents: { fssai: documents.fssai }
      };

      const res = await fetch("/api/ou
