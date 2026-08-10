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

type Restro = { [key: string]: any; id?: string | number };

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

function display(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function formatDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";
  const parsed = parseFssaiDate(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function isExpired(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  const expiryDate = parseFssaiDate(raw);
  expiryDate.setHours(23, 59, 59, 999);
  const expiry = expiryDate.getTime();
  return Number.isFinite(expiry) && expiry < Date.now();
}

function parseFssaiDate(raw: string) {
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const first = Number(slash[1]);
    const second = Number(slash[2]);
    const month = second > 12 ? first : second;
    const day = second > 12 ? second : first;
    return new Date(Number(slash[3]), month - 1, day);
  }

  return new Date(Number.NaN);
}

function formatTime(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";
  return raw.slice(0, 5);
}

function formatMoney(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "-";
}

function restroPhotoUrl(value: unknown) {
  const path = String(value ?? "").trim();
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("RestroDisplayPhoto/")
    ? path.slice("RestroDisplayPhoto/".length)
    : path;
  return supabase.storage.from("RestroDisplayPhoto").getPublicUrl(normalizedPath).data.publicUrl;
}

function Pair({ top, bottom, topClassName = "" }: {
  top: React.ReactNode;
  bottom: React.ReactNode;
  topClassName?: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className={`font-semibold text-slate-900 ${topClassName}`}>{top}</div>
      <div className="text-xs text-slate-500">{bottom}</div>
    </div>
  );
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
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    void fetchRestros();
  }, []);

  async function fetchRestros() {
    setLoading(true);
    try {
      const response = await fetch("/api/restrosmaster", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Failed to load restros");
      const rows = (Array.isArray(payload) ? payload : []).map((row: Restro) => ({
        id: row.RestroCode,
        ...row,
      }));
      setResults(rows);
      setFilteredResults(rows);
    } catch (error: any) {
      alert(`Failed to load restros: ${error?.message || String(error)}`);
      setResults([]);
      setFilteredResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setFilteredResults(results.filter((item) => {
      const statusMatches = statusFilter === "active"
        ? isRaileatsActive(item.RaileatsStatus)
        : statusFilter === "deactive"
          ? !isRaileatsActive(item.RaileatsStatus)
          : true;
      return valueIncludes(item.RestroCode, restroCode) &&
        valueIncludes(item.OwnerName, ownerName) &&
        valueIncludes(item.StationCode, stationCode) &&
        valueIncludes(item.StationName, stationName) &&
        valueIncludes(item.RestroName, restroName) &&
        valueIncludes(item.OwnerPhone, ownerPhone) &&
        valueIncludes(item.FSSAINumber ?? item.FSSAI, fssaiNumber) &&
        statusMatches;
    }));
  }

  function resetFilters() {
    setRestroCode("");
    setOwnerName("");
    setStationCode("");
    setStationName("");
    setRestroName("");
    setOwnerPhone("");
    setFssaiNumber("");
    setStatusFilter("");
    setFilteredResults(results);
  }

  function downloadOutletReport() {
    const downloadRows = filteredResults.length ? filteredResults : results;
    if (!downloadRows.length) return alert("No data found to download");
    const headers = Object.keys(downloadRows[0]).filter((header) => header !== "id");
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...downloadRows.map((row) =>
      headers.map((header) => escape(row[header])).join(",")
    )].join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Outlet_Master_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function toggleRaileats(row: Restro) {
    const next = isRaileatsActive(row.RaileatsStatus) ? 0 : 1;
    const previousResults = results;
    const previousFiltered = filteredResults;
    const apply = (list: Restro[]) => list.map((item) =>
      String(item.RestroCode) === String(row.RestroCode)
        ? { ...item, RaileatsStatus: next }
        : item
    );
    setResults(apply);
    setFilteredResults(apply);
    try {
      const response = await fetch(`/api/admin/restros/${row.RestroCode}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RaileatsStatus: next }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Status update failed");
    } catch (error: any) {
      setResults(previousResults);
      setFilteredResults(previousFiltered);
      alert(`Failed to update Raileats status: ${error?.message || String(error)}`);
    }
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (event.key === "Enter") handleSearch();
  };

  const columns: Column<Restro>[] = [
    {
      key: "restaurant",
      title: "Restaurant",
      width: "180px",
      render: (row) => {
        const count = Number(row.NearbyActiveOrderCount) || 0;
        return <Pair
          top={<span className="inline-flex items-center gap-2">
            <span>{display(row.RestroCode)}</span>
            {count > 0 && <span
              className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white"
              title={`${count} active order${count === 1 ? "" : "s"} from 60 minutes before to 30 minutes after now`}
              aria-label={`${count} nearby active orders`}
            >{count}</span>}
          </span>}
          bottom={display(row.RestroName)}
        />;
      },
    },
    {
      key: "station",
      title: "Station",
      width: "140px",
      render: (row) => <Pair top={display(row.StationCode)} bottom={display(row.StationName)} />,
    },
    {
      key: "owner",
      title: "Owner",
      width: "160px",
      render: (row) => <Pair top={display(row.OwnerName)} bottom={display(row.OwnerPhone)} />,
    },
    {
      key: "fssai",
      title: "FSSAI / Expiry",
      width: "170px",
      render: (row) => {
        const expiry = row.FSSAIExpiryDate;
        const expired = isExpired(expiry);
        return <Pair
          top={display(row.FSSAINumber ?? row.FSSAI)}
          bottom={<span className={expired ? "font-semibold text-red-600" : ""}>
            {formatDate(expiry)}{expired ? " · Expired" : ""}
          </span>}
        />;
      },
    },
    {
      key: "ratingPhoto",
      title: "Rating / Photo",
      width: "110px",
      render: (row) => {
        const photo = restroPhotoUrl(row.RestroDisplayPhoto);
        return <div className="space-y-1">
          <div className="font-semibold text-slate-900">★ {display(row.RestroRating)}</div>
          {photo ? <img src={photo} alt={`${display(row.RestroName)} display`} className="h-9 w-9 rounded-md border border-slate-200 object-cover" loading="lazy" /> : <span className="text-xs text-slate-400">No photo</span>}
        </div>;
      },
    },
    {
      key: "hoursMinimum",
      title: "Open / Close / Min",
      width: "145px",
      render: (row) => <div className="space-y-1 text-xs">
        <div><span className="font-semibold text-emerald-700">Open</span> {formatTime(row.open_time)}</div>
        <div><span className="font-semibold text-red-600">Close</span> {formatTime(row.closed_time)}</div>
        <div className="font-semibold text-slate-900">Min {formatMoney(row.MinimumOrderValue)}</div>
      </div>,
    },
    {
      key: "menuCutoff",
      title: "Active Menu / Cutoff",
      width: "135px",
      render: (row) => <div className="min-w-0 space-y-1">
        <div className="font-semibold text-slate-900">{Number(row.ActiveMenuCount) || 0} items</div>
        <div className="text-xs font-medium text-sky-700">Images: {Number(row.ActiveMenuImageCount) || 0}</div>
        <div className="text-xs text-slate-500">Cutoff {display(row.CutOffTime)}</div>
      </div>,
    },
    {
      key: "controls",
      title: "Status / Edit",
      width: "105px",
      render: (row) => {
        const on = isRaileatsActive(row.RaileatsStatus);
        return <div className="flex flex-col items-start gap-2">
          <button type="button" onClick={() => void toggleRaileats(row)} className={`relative h-6 w-12 rounded-full transition ${on ? "bg-sky-500" : "bg-slate-400"}`} aria-label={on ? "Deactivate RailEats" : "Activate RailEats"}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-7" : "left-1"}`} />
          </button>
          <AdminButton variant="secondary" className="h-8 bg-amber-400 px-3 text-black hover:bg-amber-500" onClick={() => router.push(`/admin/restros/${row.RestroCode}/edit`)}>Edit</AdminButton>
        </div>;
      },
    },
  ];

  return <AdminPage title="Restro Master" subtitle="Search, manage, and update RailEats restaurant outlets" actions={<div className="flex flex-wrap gap-2">
    <AdminButton variant="secondary" onClick={downloadOutletReport}>Download Outlet Master Report</AdminButton>
    <AdminButton variant="success" onClick={() => {
      try {
        localStorage.removeItem("new_restro_code");
        localStorage.removeItem("new_restro_basic");
      } catch {}
      router.push("/admin/restros/new/basic");
    }}>+ Add New Restro</AdminButton>
  </div>}>
    <AdminToolbar actions={<><AdminButton onClick={handleSearch}>Search</AdminButton><AdminButton variant="secondary" onClick={resetFilters}>Reset</AdminButton></>}>
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <AdminInput placeholder="RestroCode" value={restroCode} onChange={(event) => setRestroCode(event.target.value)} onKeyDown={handleSearchKeyDown} />
        <AdminInput placeholder="OwnerName" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} onKeyDown={handleSearchKeyDown} />
        <AdminInput placeholder="StationCode" value={stationCode} onChange={(event) => setStationCode(event.target.value)} onKeyDown={handleSearchKeyDown} />
        <AdminInput placeholder="StationName" value={stationName} onChange={(event) => setStationName(event.target.value)} onKeyDown={handleSearchKeyDown} />
        <AdminInput placeholder="RestroName" value={restroName} onChange={(event) => setRestroName(event.target.value)} onKeyDown={handleSearchKeyDown} />
        <AdminInput placeholder="OwnerPhone" value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} onKeyDown={handleSearchKeyDown} />
        <AdminInput placeholder="FSSAINumber" value={fssaiNumber} onChange={(event) => setFssaiNumber(event.target.value)} onKeyDown={handleSearchKeyDown} />
        <AdminSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} onKeyDown={handleSearchKeyDown}>
          <option value="">RaileatsStatus</option><option value="active">Active</option><option value="deactive">Deactivate</option>
        </AdminSelect>
      </div>
    </AdminToolbar>
    <AdminCard bodyClassName="p-0"><AdminTable title="" subtitle="" columns={columns} data={filteredResults} loading={loading} pageSize={30} compact /></AdminCard>
  </AdminPage>;
}
