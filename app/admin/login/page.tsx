// app/admin/login/page.tsx
"use client";

import React, { useState } from "react";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState(""); // mobile or email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError("Please enter mobile/email and password");
      return;
    }
    setLoading(true);

    try {
      // Build payload: send mobile OR email depending on input
      const payload: any = { password };
      if (identifier.includes("@")) payload.email = identifier.trim();
      else payload.mobile = identifier.trim();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include", // <-- important so cookies set by server are stored
      });

      // debug logs (will appear in browser console)
      console.log("Login response status:", res.status, "ok:", res.ok);

      const json = await res.json().catch(() => ({}));
      console.log("Login response json:", json);

      if (!res.ok) {
        setError(json?.message || "Login failed");
        return;
      }

      // Success: full navigation so cookies are attached for subsequent server requests
      window.location.replace("/admin/home");
    } catch (err: any) {
      console.error("Login network error:", err);
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
          User ID (mobile or email)
        </label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
            borderRadius: 6,
            border: "1px solid #e6e6e6",
            boxSizing: "border-box",
          }}
          placeholder="eg. 8888888888 or name@example.com"
        />

        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 40px 10px 10px",
              marginBottom: 14,
              borderRadius: 6,
              border: "1px solid #e6e6e6",
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label="Toggle password visibility"
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              height: 32,
              width: 32,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

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
