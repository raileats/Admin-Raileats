// app/admin/trains/page.tsx
"use client";

import React, {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminInput } from "@/components/admin/AdminField";
import AdminPage from "@/components/admin/AdminPage";
import AdminToolbar from "@/components/admin/AdminToolbar";

type TrainRow = {
  trainId: number;
  trainNumber: number | null;
  trainName: string | null;
  runningDays: string | null;
  StnNumber: number | null;
  StationCode: string | null;
  Distance: string | null;
  Stoptime: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiResponse = {
  ok: boolean;
  trains: TrainRow[];
  error?: string;
};

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "-";
}

export default function AdminTrainsPage() {
  const [trains, setTrains] = useState<TrainRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchText, setSearchText] = useState("");

  const [searchTrainId, setSearchTrainId] = useState("");
  const [searchTrainNumber, setSearchTrainNumber] = useState("");
  const [searchTrainName, setSearchTrainName] = useState("");
  const [searchStationCode, setSearchStationCode] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadTrains(q?: string) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (q && q.trim()) {
        params.set("q", q.trim());
      }

      const res = await fetch(`/api/admin/trains?${params.toString()}`, {
        cache: "no-store",
      });
      const json: ApiResponse = await res.json();

      if (!json.ok) {
        console.error("loadTrains failed", json);
        setError("Failed to load trains.");
        setTrains([]);
        return;
      }

      setTrains(json.trains || []);
    } catch (e) {
      console.error("loadTrains error", e);
      setError("Failed to load trains.");
      setTrains([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrains();
  }, []);

  function onSearchClick() {
    const parts = [
      searchTrainId,
      searchTrainNumber,
      searchTrainName,
      searchStationCode,
    ]
      .map((s) => s.trim())
      .filter(Boolean);

    const combined = parts.join(" ");
    setSearchText(combined);
    loadTrains(combined);
  }

  function onReset() {
    setSearchTrainId("");
    setSearchTrainNumber("");
    setSearchTrainName("");
    setSearchStationCode("");
    setSearchText("");
    loadTrains("");
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSearchClick();
  }

  function openUploadDialog() {
    setUploadMsg("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadMsg("");

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/admin/trains/upload", {
        method: "POST",
        body: form,
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || !json.ok) {
        console.error("upload failed", json);
        setUploadMsg(
          json?.error
            ? `Upload failed: ${json.error}`
            : "Upload failed. Please check CSV."
        );
        return;
      }

      setUploadMsg(
        `Upload successful. Trains affected: ${json.trainsAffected}, rows inserted: ${json.inserted}.`
      );

      loadTrains(searchText);
    } catch (err) {
      console.error("upload error", err);
      setUploadMsg("Upload error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminPage
      title="Trains"
      subtitle="Manage train master records and upload train route CSV files"
      actions={
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFileChange}
            className="hidden"
          />
          <AdminButton
            variant="secondary"
            onClick={openUploadDialog}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </AdminButton>
        </>
      }
    >
      <AdminToolbar
        actions={
          <>
            <AdminButton onClick={onSearchClick} disabled={loading}>
              Search
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={onReset}
              disabled={loading && !searchText}
            >
              Reset
            </AdminButton>
          </>
        }
      >
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminInput
            placeholder="Train ID"
            value={searchTrainId}
            onChange={(e) => setSearchTrainId(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <AdminInput
            placeholder="Train Number"
            value={searchTrainNumber}
            onChange={(e) => setSearchTrainNumber(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <AdminInput
            placeholder="Train Name"
            value={searchTrainName}
            onChange={(e) => setSearchTrainName(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <AdminInput
            placeholder="Station Code"
            value={searchStationCode}
            onChange={(e) => setSearchStationCode(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </AdminToolbar>

      {(loading || error || uploadMsg) && (
        <div className="space-y-2">
          {loading && <p className="text-sm font-medium text-slate-500">Loading trains...</p>}
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          {uploadMsg && <p className="text-sm font-semibold text-slate-700">{uploadMsg}</p>}
        </div>
      )}

      <AdminCard bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Train ID</th>
                <th className="px-4 py-3 text-left">Train Number</th>
                <th className="px-4 py-3 text-left">Train Name</th>
                <th className="px-4 py-3 text-left">Stn No.</th>
                <th className="px-4 py-3 text-left">Station Code</th>
                <th className="px-4 py-3 text-left">Distance</th>
                <th className="px-4 py-3 text-left">Stoptime</th>
                <th className="px-4 py-3 text-left">Running Days</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Updated</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trains.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={12}>
                    No trains found.
                  </td>
                </tr>
              ) : (
                trains.map((t) => (
                  <tr
                    key={`${t.trainId}-${t.trainNumber ?? "null"}`}
                    className="bg-white hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 align-top font-semibold">{t.trainId}</td>
                    <td className="px-4 py-3 align-top">{t.trainNumber ?? "-"}</td>
                    <td className="px-4 py-3 align-top">{t.trainName ?? "-"}</td>
                    <td className="px-4 py-3 align-top">{t.StnNumber ?? "-"}</td>
                    <td className="px-4 py-3 align-top">{t.StationCode ?? "-"}</td>
                    <td className="px-4 py-3 align-top">{t.Distance ?? "-"}</td>
                    <td className="px-4 py-3 align-top">{t.Stoptime ?? "-"}</td>
                    <td className="px-4 py-3 align-top">{t.runningDays ?? "-"}</td>
                    <td className="px-4 py-3 align-top">{t.status ?? "N/A"}</td>
                    <td className="px-4 py-3 align-top">{dateOnly(t.created_at)}</td>
                    <td className="px-4 py-3 align-top">{dateOnly(t.updated_at)}</td>
                    <td className="px-4 py-3 align-top">
                      {t.trainNumber != null ? (
                        <Link
                          href={`/admin/trains/${encodeURIComponent(String(t.trainNumber))}`}
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
