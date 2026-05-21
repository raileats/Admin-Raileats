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

export default function RestroMasterPage() {
  const router = useRouter();

  const [results, setResults] = useState<Restro[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAddRestro, setOpenAddRestro] = useState(false);

  // ✅ SEARCH STATES
  const [searchBy, setSearchBy] = useState("RestroName");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchRestros();
  }, []);

  async function fetchRestros() {
    setLoading(true);

    const { data } = await supabase
      .from("RestroMaster")
      .select("*")
      .order("RestroCode", { ascending: false });

    setResults(
      (data ?? []).map((r: any) => ({
        id: r.RestroCode,
        ...r,
      }))
    );

    setLoading(false);
  }

  /* 🔥 SAME API AS BasicInformationTab */
  async function toggleRaileats(row: Restro) {
    const current = Number(row.RaileatsStatus ?? 0);
    const next = current === 1 ? 0 : 1;

    try {
      const res = await fetch(
        `/api/admin/restros/${encodeURIComponent(
          row.RestroCode
        )}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raileatsStatus: next }),
        }
      );

      if (!res.ok) {
        alert("Failed to update Raileats status");
        return;
      }

      fetchRestros(); // 🔄 refresh list
    } catch (e) {
      alert("Network error while updating status");
    }
  }

  function openEdit(code: string | number) {
    router.push(`/admin/restros/${code}/edit`);
  }

  // ✅ FILTER LOGIC
  const filteredResults = results.filter((item) => {
    let matchesSearch = true;
    let matchesStatus = true;

    // SEARCH FILTER
    if (searchText.trim() !== "") {
      const value =
        item?.[searchBy]?.toString().toLowerCase() || "";

      matchesSearch = value.includes(
        searchText.toLowerCase()
      );
    }

    // STATUS FILTER
    if (statusFilter === "active") {
      matchesStatus = Number(item.RaileatsStatus) === 1;
    }

    if (statusFilter === "deactive") {
      matchesStatus = Number(item.RaileatsStatus) === 0;
    }

    return matchesSearch && matchesStatus;
  });

  const columns: Column<Restro>[] = [
    { key: "RestroCode", title: "Restro Code", width: "110px" },
    { key: "RestroName", title: "Restro Name" },
    { key: "StationCode", title: "Station Code", width: "100px" },
    { key: "StationName", title: "Station Name" },
    { key: "OwnerName", title: "Owner Name" },
    { key: "OwnerPhone", title: "Owner Phone", width: "140px" },

    /* ✅ SAME LOOK + LOGIC AS EDIT PAGE */
    {
      key: "RaileatsStatus",
      title: "Raileats",
      render: (row) => {
        const on = Number(row.RaileatsStatus ?? 0) === 1;

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
      <h2 className="text-xl font-semibold mb-6">
        Restro Master
      </h2>

      {/* ✅ SEARCH + BUTTON SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">

        {/* LEFT SIDE */}
        <div className="flex flex-wrap items-center gap-3">

          {/* SEARCH BY */}
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="OwnerPhone">
              Owner Mobile
            </option>

            <option value="RestroCode">
              Restro Code
            </option>

            <option value="FSSAI">
              By FSSAI
            </option>

            <option value="RestroName">
              By Restro Name
            </option>

            <option value="OwnerName">
              By Owner Name
            </option>

            <option value="StationCode">
              By STN Code
            </option>

            <option value="StationName">
              By Station Name
            </option>
          </select>

          {/* SEARCH INPUT */}
          <input
            type="text"
            placeholder="Search here..."
            value={searchText}
            onChange={(e) =>
              setSearchText(e.target.value)
            }
            className="border rounded-lg px-3 py-2 w-[240px] text-sm"
          />

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="deactive">
              Deactivate
            </option>
          </select>
        </div>

        {/* RIGHT SIDE BUTTON */}
        <button
          onClick={() => setOpenAddRestro(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          + Add New Restro
        </button>
      </div>

      <AdminTable
        title=""
        subtitle=""
        columns={columns}
        data={filteredResults}
        loading={loading}
        pageSize={10}
        actions={(row) => (
          <button
            onClick={() =>
              openEdit(row.RestroCode)
            }
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
          onClose={() =>
            setOpenAddRestro(false)
          }
        />
      )}
    </main>
  );
}
