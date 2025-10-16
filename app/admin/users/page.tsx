"use client";
import React, { useEffect, useState } from "react";
import Modal from "react-modal";

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
    if (typeof window !== "undefined") {
      try {
        Modal.setAppElement("body");
      } catch {}
    }
  }, []);

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
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setUsers(json.users || []);
    } catch (err) {
      console.error("fetchUsers error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(u: User) {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !u.status }),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchUsers();
    } catch (err) {
      alert("Failed to change status");
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-yellow-400 text-black px-4 py-2 rounded-md hover:shadow"
        >
          Add New User
        </button>
      </div>

      <div className="flex gap-3 mb-6 items-center">
        <input
          placeholder="Search by name or mobile"
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
        <button
          onClick={() => fetchUsers()}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Search
        </button>
      </div>

      <div className="bg-white rounded-lg shadow ring-1 ring-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-6 py-3">User ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Mobile</th>
              <th>Photo</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Password</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center p-6">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center p-6">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm break-all">{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.user_type}</td>
                  <td>{u.mobile}</td>
                  <td>
                    {u.photo_url ? (
                      <img
                        src={u.photo_url}
                        alt="photo"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                        NA
                      </div>
                    )}
                  </td>
                  <td className="text-sm">
                    {u.created_at && new Date(u.created_at).toLocaleString()}
                  </td>
                  <td className="text-sm">
                    {u.updated_at && new Date(u.updated_at).toLocaleString()}
                  </td>
                  <td>
                    <button
                      onClick={() => setEditUser(u)}
                      className="text-xs underline text-blue-600"
                    >
                      Edit/Password
                    </button>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={u.status}
                      onChange={() => toggleStatus(u)}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => setEditUser(u)}
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                    >
                      Edit
                    </button>
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
