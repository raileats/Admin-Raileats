"use client";

import React, { useEffect, useState } from "react";
import Modal from "react-modal";

type User = {
  id: string; // actual db uuid
  user_type: string;
  name: string;
  mobile: string;
  photo_url?: string | null;
  status: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("Super Admin");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // set app element client-side to avoid SSR issues
  useEffect(() => {
    if (typeof document !== "undefined") {
      Modal.setAppElement(document.body);
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterType) params.set("user_type", filterType);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      // ensure boolean for status
      const rows: User[] = (json.users || []).map((u: any) => ({
        ...u,
        status: !!u.status,
      }));
      setUsers(rows);
    } catch (err) {
      console.error("fetchUsers error:", err);
      alert("Error loading users");
    } finally {
      setLoading(false);
    }
  }

  // toggle status with PATCH
  async function toggleStatus(u: User) {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !u.status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed");
      }
      await fetchUsers();
    } catch (err: any) {
      alert("Failed to change status: " + (err.message || err));
    }
  }

  // compute next display id for UI (not modifying DB id)
  const nextDisplayId = users.length > 0 ? users.length + 1 : 1;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-yellow-400 text-black px-4 py-2 rounded"
        >
          Add New User
        </button>
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
              <th className="p-3">#</th>
              <th>User ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Mobile</th>
              <th>Photo</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u, idx) => (
                <tr key={u.id} className="border-t">
                  {/* sequential display id */}
                  <td className="p-3 text-sm">{idx + 1}</td>

                  {/* actual DB id (uuid) */}
                  <td className="p-3 text-sm truncate max-w-[200px]">{u.id}</td>

                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.user_type}</td>
                  <td className="p-3">{u.mobile}</td>

                  <td className="p-3">
                    {u.photo_url ? (
                      <img src={u.photo_url} alt="photo" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                        NA
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-sm">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : ""}
                  </td>

                  <td className="p-3 text-sm">
                    {u.updated_at ? new Date(u.updated_at).toLocaleString() : ""}
                  </td>

                  <td className="p-3">
                    {/* slider style toggle */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={u.status}
                        onChange={() => toggleStatus(u)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-green-500 peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-green-300 transition-colors" />
                      <span className="ml-2 text-sm">{u.status ? "Active" : "Blocked"}</span>
                    </label>
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => setEditUser(u)}
                      title="Edit"
                      className="p-2 border rounded bg-white hover:bg-gray-50"
                    >
                      <span role="img" aria-label="edit">✏️</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editUser}
        onRequestClose={() => setEditUser(null)}
        className="max-w-2xl mx-auto mt-20 bg-white p-6 rounded shadow"
        overlayClassName="fixed inset-0 bg-black/30 flex items-start justify-center z-50"
      >
        {editUser && (
          <EditUserForm
            user={editUser}
            onClose={(refresh) => {
              setEditUser(null);
              if (refresh) fetchUsers();
            }}
          />
        )}
      </Modal>

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onRequestClose={() => setIsAddOpen(false)}
        className="max-w-xl mx-auto mt-20 bg-white p-6 rounded shadow"
        overlayClassName="fixed inset-0 bg-black/30 flex items-start justify-center z-50"
      >
        <AddUserForm
          nextDisplayId={nextDisplayId}
          onClose={(refresh) => {
            setIsAddOpen(false);
            if (refresh) fetchUsers();
          }}
        />
      </Modal>
    </div>
  );
}

/* ---------------------- Sub Components ---------------------- */

function EditUserForm({
  user,
  onClose,
}: {
  user: User;
  onClose: (refresh: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: user.name,
    user_type: user.user_type,
    mobile: user.mobile,
    password: "",
    status: user.status,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Failed");
      }
      alert("User updated!");
      onClose(true);
    } catch (err: any) {
      alert("Error: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Edit User</h2>
      <div className="flex flex-col gap-3">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
          placeholder="Name"
        />
        <input
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          className="border p-2 rounded"
          placeholder="Mobile"
        />
        <select
          value={form.user_type}
          onChange={(e) => setForm({ ...form, user_type: e.target.value })}
          className="border p-2 rounded"
        >
          <option>Super Admin</option>
          <option>Admin</option>
          <option>Support</option>
        </select>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border p-2 rounded"
          placeholder="New Password (optional)"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.checked })}
          />
          Active
        </label>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => onClose(false)}>
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function AddUserForm({
  nextDisplayId,
  onClose,
}: {
  nextDisplayId: number;
  onClose: (refresh: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    user_type: "Super Admin",
    mobile: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!form.name || !form.password) {
      alert("Name and Password required!");
      return;
    }
    setSaving(true);
    try {
      // You can pass any extra fields if backend supports them.
      const payload = { ...form };

      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to add user");

      // NOTE: server will decide and create actual id. For UI we show sequence as nextDisplayId.
      alert(`User added! Display ID: ${nextDisplayId}`);
      onClose(true);
    } catch (err: any) {
      alert("Error: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Add New User</h2>
      <div className="mb-3 text-sm text-gray-600">Next User ID (display): <strong>{nextDisplayId}</strong></div>
      <div className="flex flex-col gap-3">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
          placeholder="Name"
        />
        <input
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          className="border p-2 rounded"
          placeholder="Mobile"
        />
        <select
          value={form.user_type}
          onChange={(e) => setForm({ ...form, user_type: e.target.value })}
          className="border p-2 rounded"
        >
          <option>Super Admin</option>
          <option>Admin</option>
          <option>Support</option>
        </select>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border p-2 rounded"
          placeholder="Password"
        />
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => onClose(false)}>
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={saving}
          onClick={handleAdd}
        >
          {saving ? "Adding..." : "Add User"}
        </button>
      </div>
    </div>
  );
}
