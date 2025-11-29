// app/admin/trains/page.tsx
"use client";

import React, {
  useEffect,
  useState,
  useRef,
  ChangeEvent,
} from "react";

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

export default function AdminTrainsPage() {
  const [trains, setTrains] = useState<TrainRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // last used combined search string (CSV upload ke baad refresh ke liye)
  const [searchText, setSearchText] = useState("");

  // 🔹 individual search boxes
  const [searchTrainId, setSearchTrainId] = useState("");
  const [searchTrainNumber, setSearchTrainNumber] = useState("");
  const [searchTrainName, setSearchTrainName] = useState("");
  const [searchStationCode, setSearchStationCode] = useState("");

  // CSV upload state
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadTrains(q?: string) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (q && q.trim()) {
        // combined search param (Train ID / Number / Name / Station)
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

  // 🔍 Search button click
  function onSearchClick() {
    // 4 alag boxes ko ek string me jodo (backend old `q` param use karega)
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

  // 🔄 Reset button
  function onReset() {
    setSearchTrainId("");
    setSearchTrainNumber("");
    setSearchTrainName("");
    setSearchStationCode("");
    setSearchText("");
    loadTrains("");
  }

  // ---------- CSV upload handlers ----------

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
            : "Upload failed. Please check CSV.",
        );
        return;
      }

      setUploadMsg(
        `Upload successful. Trains affected: ${json.trainsAffected}, rows inserted: ${json.inserted}.`,
      );

      // refresh list with current search
      loadTrains(searchText);
    } catch (err) {
      console.error("upload error", err);
      setUploadMsg("Upload error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="page-root">
      {/* Header + Upload button */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-semibold">Trains</h1>
          <p className="text-sm text-gray-600">Manage trains here.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFileChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="px-3 py-2 rounded border text-sm"
            onClick={openUploadDialog}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload CSV"}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex flex-wrap items-end gap-2 mb-3 mt-2">
        <input
          className="border rounded px-3 py-2 text-sm w-32"
          placeholder="Train ID"
          value={searchTrainId}
          onChange={(e) => setSearchTrainId(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm w-40"
          placeholder="Train Number"
          value={searchTrainNumber}
          onChange={(e) => setSearchTrainNumber(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[160px]"
          placeholder="Train Name"
          value={searchTrainName}
          onChange={(e) => setSearchTrainName(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm w-36"
          placeholder="Station Code"
          value={searchStationCode}
          onChange={(e) => setSearchStationCode(e.target.value)}
        />

        <button
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
          onClick={onSearchClick}
          disabled={loading}
        >
          Search
        </button>
        <button
          className="px-3 py-2 rounded border text-sm"
          onClick={onReset}
          disabled={loading && !searchText}
        >
          Reset
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 mb-2">Loading trains…</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}
      {uploadMsg && (
        <p className="text-sm text-gray-700 mb-2">{uploadMsg}</p>
      )}

      <div className="border rounded bg-white overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Train ID</th>
              <th className="px-3 py-2 text-left">Train Number</th>
              <th className="px-3 py-2 text-left">Train Name</th>
              <th className="px-3 py-2 text-left">Stn No.</th>
              <th className="px-3 py-2 text-left">Station Code</th>
              <th className="px-3 py-2 text-left">Distance</th>
              <th className="px-3 py-2 text-left">Stoptime</th>
              <th className="px-3 py-2 text-left">Running Days</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Updated</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trains.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-4 text-center text-gray-500"
                  colSpan={12}
                >
                  No trains found.
                </td>
              </tr>
            ) : (
              trains.map((t) => (
                <tr
                  key={`${t.trainId}-${t.trainNumber ?? "null"}`}
                  className="border-t"
                >
                  <td className="px-3 py-2 align-top">{t.trainId}</td>
                  <td className="px-3 py-2 align-top">
                    {t.trainNumber ?? "-"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {t.trainName ?? "-"}
                  </td>

                  {/* DATA FROM FIRST ROUTE ROW */}
                  <td className="px-3 py-2 align-top">
                    {t.StnNumber ?? "-"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {t.StationCode ?? "-"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {t.Distance ?? "-"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {t.Stoptime ?? "-"}
                  </td>

                  <td className="px-3 py-2 align-top">
                    {t.runningDays ?? "-"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {t.status ?? "N/A"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {t.created_at ? t.created_at.slice(0, 10) : "-"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {t.updated_at ? t.updated_at.slice(0, 10) : "-"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {t.trainNumber != null ? (
                      <a
                        href={`/admin/trains/${encodeURIComponent(
                          String(t.trainNumber),
                        )}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </a>
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
    </div>
  );
}
