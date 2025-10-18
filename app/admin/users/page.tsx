// app/admin/users/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON);

type User = {
  id: string;
  user_id?: string | null;
  user_type: string;
  name: string;
  mobile: string;
  photo_url?: string | null;
  dob?: string | null;
  email?: string | null;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
  seq?: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const el = document.getElementById("__next") || undefined;
      try {
        Modal.setAppElement(el || undefined);
      } catch (e) {}
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
          <option>All</option>
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
                  <td className="p-3 text-sm">
                    {u.user_id ?? (u.seq != null ? String(u.seq) : u.id)}
                  </td>
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
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
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

/* ---------------------- EditUserForm ---------------------- */

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

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photo_url ?? null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPhotoPreview(user.photo_url ?? null);
    }
  }, [photoFile, user.photo_url]);

  function validate() {
    if (!form.name || !/^[A-Za-z\s]+$/.test(form.name.trim())) {
      alert("Name required and should contain only letters and spaces.");
      return false;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      alert("Mobile must be exactly 10 digits.");
      return false;
    }
    if (!form.email || !(form.email.includes("@") && form.email.includes(".com"))) {
      alert("Enter a valid email containing '@' and '.com'.");
      return false;
    }
    return true;
  }

  // ===== server upload version (Edit) =====
  async function uploadPhotoIfAny(): Promise<string | null> {
    if (!photoFile) return null;
    const fd = new FormData();
    fd.append("file", photoFile);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.message || "Photo upload failed");
    return j.url ?? null;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const photo_url = await uploadPhotoIfAny().catch((e) => {
        throw e;
      });

      const payload: any = {
        name: form.name.trim(),
        user_type: form.user_type,
        mobile: form.mobile,
        status: form.status,
        email: form.email.trim() || null,
        dob: form.dob || null,
      };
      if (form.password) payload.password = form.password;
      if (photo_url) payload.photo_url = photo_url;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Failed");
      alert("User updated!");
      onClose(true);
    } catch (err: any) {
      console.error(err);
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
          onChange={(e) =>
            setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
          }
          className="border p-2 rounded"
          placeholder="Mobile"
          inputMode="numeric"
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
          autoComplete="off"
        />

        <input
          type="date"
          value={form.dob ?? ""}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
          className="border p-2 rounded"
          placeholder="DOB"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="New Password (optional)"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label="toggle password"
            style={{ position: "absolute", right: 8, top: 8 }}
            className="px-2"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <div>
          <label className="block text-sm mb-1">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) setPhotoFile(f);
            }}
          />
          {photoPreview ? (
            <div className="mt-2">
              <img src={photoPreview} alt="preview" className="w-20 h-20 object-cover rounded" />
              <div>
                <button
                  className="text-sm text-red-600"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}
        </div>

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

/* ---------------------- AddUserForm ---------------------- */

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

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    (async () => {
      setNextIdLoading(true);
      try {
        const res = await fetch("/api/admin/users/next-id");
        if (!res.ok) throw new Error("no endpoint");
        const j = await res.json().catch(() => ({}));
        if (j?.nextId) setSuggestedSeq(j.nextId);
        else setSuggestedSeq(existingCount + 1);
      } catch (e) {
        setSuggestedSeq(existingCount + 1);
      } finally {
        setNextIdLoading(false);
      }
    })();
  }, [existingCount]);

  function validate() {
    if (!form.name || !/^[A-Za-z\s]+$/.test(form.name.trim())) {
      alert("Name required and should contain only letters and spaces.");
      return false;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      alert("Mobile must be exactly 10 digits.");
      return false;
    }
    if (!form.email || !(form.email.includes("@") && form.email.includes(".com"))) {
      alert("Enter a valid email containing '@' and '.com'.");
      return false;
    }
    if (!form.password) {
      alert("Password required.");
      return false;
    }
    return true;
  }

  // ===== server upload version (Add) =====
  async function uploadPhotoIfAny(): Promise<string | null> {
    if (!photoFile) return null;
    const fd = new FormData();
    fd.append("file", photoFile);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.message || "Photo upload failed");
    return j.url ?? null;
  }

  async function handleAdd() {
    if (!validate()) return;
    setSaving(true);
    try {
      const photo_url = await uploadPhotoIfAny().catch((e) => {
        throw e;
      });

      const payload: any = {
        name: form.name.trim(),
        user_type: form.user_type,
        mobile: form.mobile,
        password: form.password,
        email: form.email.trim() || null,
        dob: form.dob || null,
        photo_url: photo_url ?? null,
      };

      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Failed");
      alert("User added!");
      onClose(true);
    } catch (err: any) {
      console.error(err);
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
          Suggested numeric id: {nextIdLoading ? "..." : suggestedSeq ?? existingCount + 1}
        </div>

        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
          placeholder="Name"
          autoComplete="name"
        />

        <input
          value={form.mobile}
          onChange={(e) =>
            setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
          }
          className="border p-2 rounded"
          placeholder="Mobile (10 digits)"
          inputMode="numeric"
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
          autoComplete="off"
        />

        <input
          type="date"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
          className="border p-2 rounded"
          placeholder="DOB"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="Password"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label="toggle password"
            style={{ position: "absolute", right: 8, top: 8 }}
            className="px-2"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <div>
          <label className="block text-sm mb-1">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) setPhotoFile(f);
            }}
          />
          {photoPreview ? (
            <div className="mt-2">
              <img src={photoPreview} alt="preview" className="w-20 h-20 object-cover rounded" />
              <div>
                <button
                  className="text-sm text-red-600"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => onClose(false)}>
          Cancel
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving} onClick={handleAdd}>
          {saving ? "Adding..." : "Add User"}
        </button>
      </div>
    </div>
  );
}
