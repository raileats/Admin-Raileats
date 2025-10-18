// app/admin/login/page.tsx
"use client";

import React, { useState } from "react";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ensure cookies are handled for same-origin
        credentials: "same-origin",
        body: JSON.stringify({ phone, password }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.message || "Login failed");
        return;
      }

      // Important: do a full page navigation so the cookie/session
      // set by the login endpoint is sent to the server on the next request.
      // This avoids the 'blank until refresh' problem.
      window.location.replace("/admin/home");
    } catch (err) {
      console.error("Login error", err);
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f7fb",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 380,
          padding: 28,
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 6px 20px rgba(10,10,25,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
        aria-label="Admin login form"
      >
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <img src="/logo.png" alt="RailEats" style={{ width: 56, height: 56 }} />
          <h2 style={{ margin: "8px 0 0" }}>RailEats Admin</h2>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fff2f0",
              color: "#9b1c1c",
              border: "1px solid #ffdede",
              padding: "8px 10px",
              borderRadius: 6,
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          User ID (mobile)
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
            borderRadius: 6,
            border: "1px solid #e6e6e6",
            boxSizing: "border-box",
          }}
          placeholder="eg. 8888888888"
        />

        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 14,
            borderRadius: 6,
            border: "1px solid #e6e6e6",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            background: "#f6b900",
            color: "#111",
            border: "none",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <div style={{ marginTop: 12, fontSize: 12, textAlign: "center", color: "#777" }}>
          Please use your admin credentials.
        </div>
      </form>
    </div>
  );
}
