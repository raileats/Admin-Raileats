// app/admin/users/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

Modal.setAppElement("#__next");

type User = {
  id: string;
  user_type: string;
  name: string;
  mobile: string;
  photo_url?: string | null;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("Super Admin");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filterType]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterType) params.set("user_type", filterType);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setUsers(json.users || []);
    } catch (err) {
      console.error(err);
      alert("Error loading users");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(u: User) {
    setEditUser(u);
  }
  function closeEdit(refresh = false) {
    setEditUser(null);
    if (refresh) fetchUsers();
  }

  async function toggleStatus(u: User) {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !u.status }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.message || "Failed");
      }
      fetchUsers();
    } catch (err:any) {
      alert("Failed to change status: " + (err.message || err));
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-yellow-400 text-black px-4 py-2 rounded"
          >
            Add New User
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search by name or mobile..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border p-2 rounded"
        >
          <option>Super Admin</option>
          <option>Admin</option>
          <option>Support</option>
        </select>
        <button onClick={() => fetchUsers()} className="px-4 border rounded">
          Search
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="p-3">User ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Mobile</th>
              <th>Photo</th>
              <th>C
