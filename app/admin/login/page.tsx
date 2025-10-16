// app/admin/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      if (res.ok) {
        // server should set cookie/session — then redirect
        router.replace("/admin/home");
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j?.message || "Login failed — check credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Network or server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
        aria-label="Admin login form"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Admin Login</h2>

        <label className="block text-sm text-gray-700 mb-1">User ID (mobile)</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          inputMode="numeric"
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          placeholder="e.g. 8888888888"
        />

        <label className="block text-sm text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          placeholder="Enter password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 text-black font-medium py-2 rounded hover:shadow disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          {/* helpful for debug */}
          <div>Need help? contact ops@raileats.in</div>
        </div>
      </form>
    </div>
  );
}
