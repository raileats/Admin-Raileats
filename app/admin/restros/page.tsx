"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminInput, AdminSelect } from "@/components/admin/AdminField";
import AdminPage from "@/components/admin/AdminPage";
import AdminToolbar from "@/components/admin/AdminToolbar";
import AdminTable, { Column } from "@/components/AdminTable";

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

    const { data, error } = await supabase
      .from("RestroMaster")
      .select("*")
      .order("RestroCode", {
        ascending: false,
      });

    if (error) {
      alert(`Failed to load restros: ${error.message}`);
      setResults([]);
      setFilteredResults([]);
      setLoading(false);
      return;
    }

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

  function resetFilters() {
    setRestroCode("");
    setOwnerName("");
    setStationCode("");
    setStationName("");
    setRestroName("");
    setOwnerPhone("");
    setFssaiNumber("");
    setGstNumber("");
    setStatusFilter("");
    setFilteredResults(results);
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
      width: "110px",
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
      width: "110px",
      render: (row) => {
        const on = isRaileatsActive(row.RaileatsStatus);

        return (
          <button
            type="button"
            onClick={() => toggleRaileats(row)}
            className={[
              "relative h-6 w-12 rounded-full transition",
              on ? "bg-sky-500" : "bg-slate-400",
            ].join(" ")}
            aria-label={on ? "Deactivate RailEats" : "Activate RailEats"}
          >
            <span
              className={[
                "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                on ? "left-7" : "left-1",
              ].join(" ")}
            />
          </button>
        );
      },
    },
  ];

  return (
    <AdminPage
      title="Restro Master"
      subtitle="Search, manage, and update RailEats restaurant outlets"
      actions={
        <AdminButton variant="success" onClick={() => router.push("/admin/restros/new/basic")}> 
          + Add New Restro
        </AdminButton>
      }
    >
      <AdminToolbar
        actions={
          <>
            <AdminButton onClick={handleSearch}>Search</AdminButton>
            <AdminButton variant="secondary" onClick={resetFilters}>
              Reset
            </AdminButton>
          </>
        }
      >
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
          <AdminInput
            type="text"
            placeholder="RestroCode"
            value={restroCode}
            onChange={(e) => setRestroCode(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          <AdminInput
            type="text"
            placeholder="OwnerName"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          <AdminInput
            type="text"
            placeholder="StationCode"
            value={stationCode}
            onChange={(e) => setStationCode(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          <AdminInput
            type="text"
            placeholder="StationName"
            value={stationName}
            onChange={(e) => setStationName(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          <AdminInput
            type="text"
            placeholder="RestroName"
            value={restroName}
            onChange={(e) => setRestroName(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          <AdminInput
            type="text"
            placeholder="OwnerPhone"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          <AdminInput
            type="text"
            placeholder="FSSAINumber"
            value={fssaiNumber}
            onChange={(e) => setFssaiNumber(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          <AdminInput
            type="text"
            placeholder="GSTNumber"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          <AdminSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          >
            <option value="">RaileatsStatus</option>
            <option value="active">Active</option>
            <option value="deactive">Deactivate</option>
          </AdminSelect>
        </div>
      </AdminToolbar>

      <AdminCard bodyClassName="p-0">
        <AdminTable
          title=""
          subtitle=""
          columns={columns}
          data={filteredResults}
          loading={loading}
          pageSize={30}
          actions={(row) => (
            <AdminButton
              variant="secondary"
              className="h-9 bg-amber-400 text-black hover:bg-amber-500"
              onClick={() => openEdit(row.RestroCode)}
            >
              Edit
            </AdminButton>
          )}
        />
      </AdminCard>
    </AdminPage>
  );
}

