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

  // Safe setAppElement: run only on client after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // use body so element always exists in app dir
        Modal.setAppElement("body");
      } catch (err) {
        // don't block rendering if something goes wrong
        console.warn("Modal.setAppElement warning:", err);
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterType) params.set("user_type", filterType);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status} ${txt}`);
      }
      const json = await res.json();
      setUsers(json.users || []);
    } catch (err: any) {
      console.error("fetchUsers error:", err);
      // show friendly message but don't throw
      alert("Error loading users: " + (err.message || err));
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
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || `Status update failed (${res.status})`);
      }
      fetchUsers();
    } catch (err: any) {
      console.error("toggleStatus error:", err);
      alert("Failed to change status: " + (err.message || err));
    }
  }

  return (
    <div className="p-8">
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
              <th className="p-3">User ID</th>
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
              users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3 text-sm">{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.user_type}</td>
                  <td>{u.mobile}</td>
                  <td className="p-2">
                    {u.photo_url ? (
                      <img
                        src={u.photo_url}
                        alt="photo"
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          // fallback to default avatar if resource 404s
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                        NA
                      </div>
                    )}
                  </td>
                  <td className="text-sm">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : ""}
                  </td>
                  <td className="text-sm">
                    {u.updated_at ? new Date(u.updated_at).toLocaleString() : ""}
                  </td>
                  <td>
                    <button
                      onClick={() => setEditUser(u)}
                      className="text-xs underline"
                    >
                      Edit/Password
                    </button>
                  </td>
                  <td>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={u.status}
                        onChange={() => toggleStatus(u)}
                      />
                      <span>{u.status ? "Active" : "Blocked"}</span>
                    </label>
                  </td>
                  <td>
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                      onClick={() => setEditUser(u)}
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

      <Modal
        isOpen={!!editUser}
        onRequestClose={() => setEditUser(null)}
        className="max-w-2xl mx-auto mt-20 bg-white p-6 rounded shadow"
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

      <Modal
        isOpen={isAddOpen}
        onRequestClose={() => setIsAddOpen(false)}
        className="max-w-xl mx-auto mt-20 bg-white p-6 rounded shadow"
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
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || `Failed (${res.status})`);
      }
      alert("User updated!");
      onClose(true);
    } catch (err: any) {
      console.error("EditUserForm.handleSave error:", err);
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
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => onClose(false)}
        >
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
      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || `Failed (${res.status})`);
      }
      alert("User added!");
      onClose(true);
    } catch (err: any) {
      console.error("AddUserForm.handleAdd error:", err);
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
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => onClose(false)}
        >
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
