// app/admin/users/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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
      console.error("fetchUsers error", err);
      alert("Error loading users");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(u: User) {
    // optimistic UI: update locally and then call API
    const newStatus = !u.status;
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: newStatus } : x)));
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to update status");
      }
    } catch (err: any) {
      alert("Failed to change status: " + (err?.message || err));
      // rollback on failure
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: u.status } : x)));
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-yellow-400 text-black px-4 py-2 rounded"
        >
          Add New User
        </button>
      </div>

      <div className="flex gap-3 mb-4 items-center">
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
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="p-3 w-12">#</th>
              <th className="p-3">User ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Mobile</th>
              <th>Photo</th>
              <th>Created</th>
              <th>Updated</th>
              <th className="text-center">Status</th>
              <th className="text-center">Action</th>
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
                  <td className="p-3 text-sm align-top">{idx + 1}</td>
                  <td className="p-3 text-sm align-top break-all">{u.id}</td>
                  <td className="align-top p-3">{u.name}</td>
                  <td className="align-top p-3">{u.user_type}</td>
                  <td className="align-top p-3">{u.mobile}</td>
                  <td className="p-2 align-top">
                    {u.photo_url ? (
                      <img src={u.photo_url} alt="photo" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                        NA
                      </div>
                    )}
                  </td>
                  <td className="text-sm p-3 align-top">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : ""}
                  </td>
                  <td className="text-sm p-3 align-top">
                    {u.updated_at ? new Date(u.updated_at).toLocaleString() : ""}
                  </td>

                  <td className="p-3 align-top text-center">
                    {/* Toggle slider */}
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={u.status}
                        onChange={() => toggleStatus(u)}
                        className="sr-only peer"
                        aria-label={`Set ${u.name} active`}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-green-500 peer-focus:ring-2 peer-focus:ring-green-300 transition-colors"></div>
                      <div
                        className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform peer-checked:translate-x-5`}
                        aria-hidden
                      />
                    </label>
                    <div className="text-xs mt-1">{u.status ? "Active" : "Blocked"}</div>
                  </td>

                  <td className="p-3 align-top text-center">
                    {/* Pencil icon button */}
                    <button
                      title="Edit"
                      onClick={() => setEditUser(u)}
                      className="inline-flex items-center justify-center w-9 h-9 bg-white border rounded shadow-sm hover:bg-gray-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 010 2.828l-9.193 9.193a1 1 0 01-.45.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.45L13.586 2.586a2 2 0 012.828 0z" />
                      </svg>
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
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        className="bg-white rounded max-w-2xl w-full mx-4 p-6 outline-none"
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
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        className="bg-white rounded max-w-xl w-full mx-4 p-6 outline-none"
      >
        <AddUserForm
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
      if (!form.password) delete payload.password;
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
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function AddUserForm({ onClose }: { onClose: (refresh: boolean) => void }) {
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
      // If backend expects sequence id or checks last id, it should handle on server.
      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed");
      alert("User added!");
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
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
          disabled={saving}
          onClick={handleAdd}
        >
          {saving ? "Adding..." : "Add User"}
        </button>
      </div>
    </div>
  );
}
