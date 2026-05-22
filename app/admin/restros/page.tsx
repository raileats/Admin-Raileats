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
  const [filteredResults, setFilteredResults] = useState<
    Restro[]
  >([]);

  const [loading, setLoading] = useState(false);

  const [openAddRestro, setOpenAddRestro] =
    useState(false);

  // ✅ SEARCH STATES
  const [ownerPhone, setOwnerPhone] =
    useState("");

  const [restroCode, setRestroCode] =
    useState("");

  const [fssai, setFssai] = useState("");

  const [restroName, setRestroName] =
    useState("");

  const [ownerName, setOwnerName] =
    useState("");

  const [stationCode, setStationCode] =
    useState("");

  const [stationName, setStationName] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

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

    const finalData = (data ?? []).map(
      (r: any) => ({
        id: r.RestroCode,
        ...r,
      })
    );

    setResults(finalData);
    setFilteredResults(finalData);

    setLoading(false);
  }

  // ✅ SEARCH FUNCTION
  function handleSearch() {
    const filtered = results.filter((item) => {

      const matchOwnerPhone =
        ownerPhone.trim() === "" ||
        String(item?.OwnerPhone || "")
          .toLowerCase()
          .includes(
            ownerPhone.toLowerCase().trim()
          );

      // ✅ RESTRO CODE SEARCH
      const matchRestroCode =
        restroCode.trim() === "" ||
        String(item?.RestroCode || "")
          .toLowerCase()
          .includes(
            restroCode.toLowerCase().trim()
          );

      const matchFssai =
        fssai.trim() === "" ||
        String(item?.FSSAI || "")
          .toLowerCase()
          .includes(
            fssai.toLowerCase().trim()
          );

      const matchRestroName =
        restroName.trim() === "" ||
        String(item?.RestroName || "")
          .toLowerCase()
          .includes(
            restroName.toLowerCase().trim()
          );

      const matchOwnerName =
        ownerName.trim() === "" ||
        String(item?.OwnerName || "")
          .toLowerCase()
          .includes(
            ownerName.toLowerCase().trim()
          );

      const matchStationCode =
        stationCode.trim() === "" ||
        String(item?.StationCode || "")
          .toLowerCase()
          .includes(
            stationCode.toLowerCase().trim()
          );

      const matchStationName =
        stationName.trim() === "" ||
        String(item?.StationName || "")
          .toLowerCase()
          .includes(
            stationName.toLowerCase().trim()
          );

      let matchStatus = true;

      if (statusFilter === "active") {
        matchStatus =
          Number(item.RaileatsStatus) === 1;
      }

      if (statusFilter === "deactive") {
        matchStatus =
          Number(item.RaileatsStatus) === 0;
      }

      return (
        matchOwnerPhone &&
        matchRestroCode &&
        matchFssai &&
        matchRestroName &&
        matchOwnerName &&
        matchStationCode &&
        matchStationName &&
        matchStatus
      );
    });

    setFilteredResults(filtered);
  }

  /* 🔥 SAME API AS BasicInformationTab */
  async function toggleRaileats(row: Restro) {
    const current = Number(
      row.RaileatsStatus ?? 0
    );

    const next = current === 1 ? 0 : 1;

    try {
      const res = await fetch(
        `/api/admin/restros/${encodeURIComponent(
          row.RestroCode
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            raileatsStatus: next,
          }),
        }
      );

      if (!res.ok) {
        alert(
          "Failed to update Raileats status"
        );

        return;
      }

      fetchRestros();
    } catch (e) {
      alert(
        "Network error while updating status"
      );
    }
  }

  function openEdit(
    code: string | number
  ) {
    router.push(
      `/admin/restros/${code}/edit`
    );
  }

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
      key: "RaileatsStatus",
      title: "Raileats",

      render: (row) => {
        const on =
          Number(
            row.RaileatsStatus ?? 0
          ) === 1;

        return (
          <div
            onClick={() =>
              toggleRaileats(row)
            }
            style={{
              width: 44,
              height: 22,
              borderRadius: 999,
              backgroundColor: on
                ? "#0ea5e9"
                : "#9ca3af",
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
                transition:
                  "left 0.2s ease",
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <main className="mx-6 my-4 max-w-full">

      <h2 className="text-xl font-semibold mb-5">
        Restro Master
      </h2>

      {/* ✅ SEARCH SECTION */}
      <div className="bg-white p-3 rounded-lg border mb-4">

        <div className="flex flex-wrap gap-2 items-center">

          {/* OWNER MOBILE */}
          <input
            type="text"
            placeholder="Owner Mobile"
            value={ownerPhone}
            onChange={(e) =>
              setOwnerPhone(
                e.target.value
              )
            }
            className="border rounded-md px-2 py-1.5 text-sm w-[125px]"
          />

          {/* RESTRO CODE */}
          <input
            type="text"
            placeholder="Restro Code"
            value={restroCode}
            onChange={(e) =>
              setRestroCode(
                e.target.value
              )
            }
            className="border rounded-md px-2 py-1.5 text-sm w-[110px]"
          />

          {/* FSSAI */}
          <input
            type="text"
            placeholder="FSSAI"
            value={fssai}
            onChange={(e) =>
              setFssai(e.target.value)
            }
            className="border rounded-md px-2 py-1.5 text-sm w-[100px]"
          />

          {/* RESTRO NAME */}
          <input
            type="text"
            placeholder="Restro Name"
            value={restroName}
            onChange={(e) =>
              setRestroName(
                e.target.value
              )
            }
            className="border rounded-md px-2 py-1.5 text-sm w-[130px]"
          />

          {/* OWNER NAME */}
          <input
            type="text"
            placeholder="Owner Name"
            value={ownerName}
            onChange={(e) =>
              setOwnerName(
                e.target.value
              )
            }
            className="border rounded-md px-2 py-1.5 text-sm w-[130px]"
          />

          {/* STN CODE */}
          <input
            type="text"
            placeholder="STN Code"
            value={stationCode}
            onChange={(e) =>
              setStationCode(
                e.target.value
              )
            }
            className="border rounded-md px-2 py-1.5 text-sm w-[95px]"
          />

          {/* STATION NAME */}
          <input
            type="text"
            placeholder="Station Name"
            value={stationName}
            onChange={(e) =>
              setStationName(
                e.target.value
              )
            }
            className="border rounded-md px-2 py-1.5 text-sm w-[130px]"
          />

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="border rounded-md px-2 py-1.5 text-sm w-[120px]"
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

          {/* SEARCH BUTTON */}
          <button
            onClick={handleSearch}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm"
          >
            Search
          </button>

          {/* ADD BUTTON */}
          <button
            onClick={() =>
              setOpenAddRestro(true)
            }
            className="px-4 py-1.5 bg-green-600 text-white rounded-md text-sm"
          >
            + Add New Restro
          </button>
        </div>
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
              openEdit(
                row.RestroCode
              )
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
