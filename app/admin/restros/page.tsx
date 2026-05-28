"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AdminTable, { Column } from "@/components/AdminTable";
import RestroEditModal from "@/components/RestroEditModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Restro = { [k: string]: any; id?: string | number };

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().trim();
}

function valueIncludes(value: unknown, searchValue: string) {
  const query = normalize(searchValue);
  return query === "" || normalize(value).includes(query);
}

function isRaileatsActive(value: unknown) {
  const status = normalize(value);
  return status === "1" || status === "active" || status === "true" || status === "on";
}

export default function RestroMasterPage() {
  const router = useRouter();

  const [results, setResults] = useState<Restro[]>([]);
  const [filteredResults, setFilteredResults] = useState<Restro[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAddRestro, setOpenAddRestro] = useState(false);

  const [restroCode, setRestroCode] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [stationName, setStationName] = useState("");
  const [restroName, setRestroName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchRestros();
  }, []);

  async function fetchRestros() {
    setLoading(true);

    const { data } = await supabase
      .from("RestroMaster")
      .select("*")
      .order("RestroCode", {
        ascending: false,
      });

    const finalData = (data ?? []).map((r: any) => ({
      id: r.RestroCode,
      ...r,
    }));

    setResults(finalData);
    setFilteredResults(finalData);
    setLoading(false);
  }

  function handleSearch() {
    const filtered = results.filter((item) => {
      const matchRestroCode = valueIncludes(item?.RestroCode, restroCode);
      const matchOwnerName = valueIncludes(item?.OwnerName, ownerName);
      const matchStationCode = valueIncludes(item?.StationCode, stationCode);
      const matchStationName = valueIncludes(item?.StationName, stationName);
      const matchRestroName = valueIncludes(item?.RestroName, restroName);
      const matchOwnerPhone = valueIncludes(item?.OwnerPhone, ownerPhone);
      const matchFssai = valueIncludes(item?.FSSAINumber ?? item?.FSSAI, fssaiNumber);
      const matchGst = valueIncludes(item?.GSTNumber, gstNumber);

      let matchStatus = true;

      if (statusFilter === "active") {
        matchStatus = isRaileatsActive(item?.RaileatsStatus);
      }

      if (statusFilter === "deactive") {
        matchStatus = !isRaileatsActive(item?.RaileatsStatus);
      }

      return (
        matchRestroCode &&
        matchOwnerName &&
        matchStationCode &&
        matchStationName &&
        matchRestroName &&
        matchOwnerPhone &&
        matchFssai &&
        matchGst &&
        matchStatus
      );
    });

    setFilteredResults(filtered);
  }

  async function toggleRaileats(row: Restro) {
    const currentOn = isRaileatsActive(row.RaileatsStatus);
    const next = currentOn ? 0 : 1;
    const previousResults = results;
    const previousFilteredResults = filteredResults;

    const applyLocalStatus = (list: Restro[]) =>
      list.map((item) =>
        String(item.RestroCode) === String(row.RestroCode)
          ? { ...item, RaileatsStatus: next }
          : item
      );

    setResults(applyLocalStatus);
    setFilteredResults(applyLocalStatus);

    const { error } = await supabase
      .from("RestroMaster")
      .update({ RaileatsStatus: next })
      .eq("RestroCode", row.RestroCode);

    if (error) {
      setResults(previousResults);
      setFilteredResults(previousFilteredResults);
      alert(`Failed to update Raileats status: ${error.message}`);
    }
  }

  function openEdit(code: string | number) {
    router.push(`/admin/restros/${code}/edit`);
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const inputClass =
    "h-10 border border-slate-300 rounded-md px-3 text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const columns: Column<Restro>[] = [
    {
      key: "RestroCode",
      title: "Restro Code",
      width: "110px",
    },
    {
      key: "RestroName",
      title: "Restro Name",
    },
    {
      key: "StationCode",
      title: "Station Code",
      width: "100px",
    },
    {
      key: "StationName",
      title: "Station Name",
    },
    {
      key: "OwnerName",
      title: "Owner Name",
    },
    {
      key: "OwnerPhone",
      title: "Owner Phone",
      width: "140px",
    },
    {
      key: "FSSAINumber",
      title: "FSSAI",
      width: "150px",
      render: (row) => <span>{row.FSSAINumber ?? row.FSSAI ?? "-"}</span>,
    },
    {
      key: "GSTNumber",
      title: "GST Number",
      width: "160px",
      render: (row) => <span>{row.GSTNumber ?? "-"}</span>,
    },
    {
      key: "RaileatsStatus",
      title: "Raileats",
      render: (row) => {
        const on = isRaileatsActive(row.RaileatsStatus);

        return (
          <div
            onClick={() => toggleRaileats(row)}
            style={{
              width: 44,
              height: 22,
              borderRadius: 999,
              backgroundColor: on ? "#0ea5e9" : "#9ca3af",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                background: "#fff",
                borderRadius: "50%",
                position: "absolute",
                top: 2,
                left: on ? 24 : 2,
                transition: "left 0.2s ease",
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <main className="mx-6 my-4 max-w-full">
      <h2 className="text-xl font-semibold mb-5">Restro Master</h2>

      <div className="bg-white p-3 rounded-lg border border-slate-200 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 gap-2 items-end">
          <input
            type="text"
            placeholder="RestroCode"
            value={restroCode}
            onChange={(e) => setRestroCode(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="OwnerName"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="StationCode"
            value={stationCode}
            onChange={(e) => setStationCode(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="StationName"
            value={stationName}
            onChange={(e) => setStationName(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="RestroName"
            value={restroName}
            onChange={(e) => setRestroName(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="OwnerPhone"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="FSSAINumber"
            value={fssaiNumber}
            onChange={(e) => setFssaiNumber(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="GSTNumber"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={inputClass}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={inputClass}
          >
            <option value="">RaileatsStatus</option>
            <option value="active">Active</option>
            <option value="deactive">Deactivate</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold"
            >
              Search
            </button>

            <button
              onClick={() => setOpenAddRestro(true)}
              className="h-10 px-5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-semibold whitespace-nowrap"
            >
              + Add New Restro
            </button>
          </div>
        </div>
      </div>

      <AdminTable
        title=""
        subtitle=""
        columns={columns}
        data={filteredResults}
        loading={loading}
        pageSize={30}
        actions={(row) => (
          <button
            onClick={() => openEdit(row.RestroCode)}
            className="px-3 py-1 rounded-md bg-amber-400 text-black"
          >
            Edit
          </button>
        )}
      />

      {openAddRestro && (
        <RestroEditModal
          restro={null}
          initialTab="Basic Information"
          onClose={() => setOpenAddRestro(false)}
        />
      )}
    </main>
  );
}
