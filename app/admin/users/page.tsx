// app/admin/users/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import Modal from "react-modal";

type User = {
  id: string;
  user_id?: string | null; // numeric id stored as text in DB
  user_type: string;
  name: string;
  mobile: string;
  photo_url?: string | null;
  dob?: string | null;
  email?: string | null;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
  seq?: number; // optional numeric sequence from backend
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("Super Admin");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // setAppElement only client-side to avoid SSR error
  useEffect(() => {
    if (typeof document !== "undefined") {
      const el = document.getElementById("__next") || undefined;
      try {
        Modal.setAppElement(el || undefined);
      } catch (e) {
        // ignore if fails in some env
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to fetch users");
      // ensure we return array of objects with requested fields
      const data = (json.users || []).map((u: User) => ({ ...u }));
      setUsers(data);
    } catch (err) {
      console.error("fetchUsers error:", err);
      alert("Error loading users");
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to update status");
      // refresh table
      fetchUsers();
    } catch (err: any) {
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
              <th className="p-3">#</th>
              <th className="p-3">User ID</th>
              <th className="p-3">Type</th>
              <th className="p-3">Name</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Photo</th>
              <th className="p-3">DOB</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Updated</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-6 text-center">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3 text-sm">{u.seq ?? i + 1}</td>

                  {/* show numeric user_id if present, else seq, else uuid */}
                  <td className="p-3 text-sm">{u.user_id ?? (u.seq != null ? String(u.seq) : u.id)}</td>

                  <td className="p-3 text-sm">{u.user_type}</td>
                  <td className="p-3 text-sm">{u.name}</td>
                  <td className="p-3 text-sm">{u.mobile}</td>
                  <td className="p-2">
                    {u.photo_url ? (
                      <img
                        src={u.photo_url}
                        alt="photo"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                        NA
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-sm">{u.dob ?? ""}</td>
                  <td className="p-3 text-sm">{u.email ?? ""}</td>
                  <td className="p-3 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={u.status}
                        onChange={() => toggleStatus(u)}
                        className="toggle-checkbox"
                        aria-label="toggle status"
                      />
                      <span>{u.status ? "Active" : "Blocked"}</span>
                    </label>
                  </td>
                  <td className="text-sm p-3">{u.created_at ? new Date(u.created_at).toLocaleString() : ""}</td>
                  <td className="text-sm p-3">{u.updated_at ? new Date(u.updated_at).toLocaleString() : ""}</td>
                  <td className="p-3">
                    <button
                      className="p-2 rounded border"
                      onClick={() => setEditUser(u)}
                      title="Edit"
                      aria-label={`Edit ${u.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="#333" strokeWidth="0" fill="#333"/>
                        <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.41l-2.34-2.34a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="#333" strokeWidth="0" fill="#333"/>
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
        style={{
          content: {
            maxWidth: "720px",
            margin: "auto",
            inset: "20% auto auto auto",
            padding: "20px",
            borderRadius: "8px",
          },
          overlay: { backgroundColor: "rgba(0,0,0,0.4)", zIndex: 2000 },
        }}
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
        style={{
          content: {
            maxWidth: "560px",
            margin: "auto",
            inset: "20% auto auto auto",
            padding: "20px",
            borderRadius: "8px",
          },
          overlay: { backgroundColor: "rgba(0,0,0,0.4)", zIndex: 2000 },
        }}
      >
        <AddUserForm
          onClose={(refresh) => {
            setIsAddOpen(false);
            if (refresh) fetchUsers();
          }}
          existingCount={users.length}
        />
      </Modal>

      <style jsx>{`
        /* simple toggle slider look */
        .toggle-checkbox {
          width: 36px;
          height: 18px;
          appearance: none;
          background: #ddd;
          border-radius: 999px;
          position: relative;
          outline: none;
          cursor: pointer;
        }
        .toggle-checkbox:checked {
          background: #34d399;
        }
        .toggle-checkbox::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.15s ease;
        }
        .toggle-checkbox:checked::after {
          transform: translateX(18px);
        }
      `}</style>
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
    name: user.name || "",
    user_type: user.user_type || "Super Admin",
    mobile: user.mobile || "",
    password: "",
    status: user.status,
    email: user.email || "",
    dob: user.dob || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      // build payload - only include password when provided
      const payload: any = {
        name: form.name,
        user_type: form.user_type,
        mobile: form.mobile,
        status: form.status,
        email: form.email || null,
        dob: form.dob || null,
      };
      if (form.password) payload.password = form.password;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j.message || "Failed");
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
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 rounded"
          placeholder="Email"
        />

        <input
          type="date"
          value={form.dob ?? ""}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
          className="border p-2 rounded"
          placeholder="DOB"
        />

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

function AddUserForm({
  onClose,
  existingCount,
}: {
  onClose: (refresh: boolean) => void;
  existingCount: number;
}) {
  const [form, setForm] = useState({
    name: "",
    user_type: "Super Admin",
    mobile: "",
    password: "",
    email: "",
    dob: "",
  });
  const [saving, setSaving] = useState(false);
  const [nextIdLoading, setNextIdLoading] = useState(false);
  const [suggestedSeq, setSuggestedSeq] = useState<number | null>(null);

  useEffect(() => {
    // try to fetch sequence from server if endpoint exists
    (async () => {
      setNextIdLoading(true);
      try {
        const res = await fetch("/api/admin/users/next-id");
        if (!res.ok) throw new Error("no endpoint");
        const j = await res.json().catch(()=>({}));
        if (j?.nextId) setSuggestedSeq(j.nextId);
        else setSuggestedSeq(existingCount + 1);
      } catch (e) {
        setSuggestedSeq(existingCount + 1);
      } finally {
        setNextIdLoading(false);
      }
    })();
  }, [existingCount]);

  async function handleAdd() {
    if (!form.name || !form.password) {
      alert("Name and Password required!");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        user_type: form.user_type,
        mobile: form.mobile,
        password: form.password,
        email: form.email || null,
        dob: form.dob || null,
        // do not send seq unless you really want to - backend will ignore or handle it
      };

      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j.message || "Failed");
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
        <div className="text-sm text-gray-600">
          Suggested numeric id:{" "}
          {nextIdLoading ? "..." : suggestedSeq ?? existingCount + 1}
        </div>
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
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 rounded"
          placeholder="Email"
        />

        <input
          type="date"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
          className="border p-2 rounded"
          placeholder="DOB"
        />

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
