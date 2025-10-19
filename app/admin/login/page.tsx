// app/admin/login/page.tsx
"use client";

import React, { useState } from "react";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleIdentifierChange(v: string) {
    setIdentifier(v);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (submitting) return;
    setSubmitting(true);
    // allow native submit so browser handles Set-Cookie + redirect
    setTimeout(() => setSubmitting(false), 5000);
  }

  // compute mobile/email values to put into hidden inputs
  const mobileVal = identifier && !identifier.includes("@") ? identifier.trim() : "";
  const emailVal = identifier && identifier.includes("@") ? identifier.trim() : "";

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
        method="post"
        action="/api/auth/login"
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

        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          User ID (mobile or email)
        </label>
        <input
          name="identifier"
          value={identifier}
          onChange={(e) => handleIdentifierChange(e.target.value)}
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

        {/* Hidden inputs updated on every change so they are always present in the POST */}
        <input type="hidden" name="mobile" value={mobileVal} />
        <input type="hidden" name="email" value={emailVal} />

        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Password</label>
        <div style={{ position: "relative" }}>
          <input
            name="password"
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
            autoComplete="current-password"
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
          disabled={submitting}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            background: "#f6b900",
            color: "#111",
            border: "none",
            fontWeight: 600,
            cursor: submitting ? "default" : "pointer",
          }}
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>

        <div style={{ marginTop: 12, fontSize: 12, textAlign: "center", color: "#777" }}>
          Please use your admin credentials.
        </div>
      </form>
    </div>
  );
}
