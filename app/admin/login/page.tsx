// app/admin/login/page.tsx
"use client";

import React, { useState } from "react";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // We use native form POST to /api/auth/login so browser applies Set-Cookie and follows redirect
  // Server-side parseBody supports formData, so this works with your existing login route.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setSubmitting(true);
    // don't call e.preventDefault() — allow native submit so cookies & redirect are handled by browser
    // re-enable button after a short timeout in case of network issues
    setTimeout(() => setSubmitting(false), 5000);
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

        {/* Hidden helpers; server expects either mobile or email.
            We copy identifier into the correct hidden field right before native submit */}
        <input type="hidden" name="identifier_raw" value={identifier} />

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

      {/* Inline script to convert identifier to mobile/email before native submit.
          Keeps server code unchanged (it supports reading mobile/email from formData). */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  try {
    const form = document.currentScript && document.currentScript.closest('form');
    if (!form) return;
    form.addEventListener('submit', function(){
      const idInput = form.querySelector('input[name="identifier"]');
      const v = idInput ? idInput.value.trim() : '';
      // remove previous helper fields if any
      const prevMobile = form.querySelector('input[name="mobile"]');
      const prevEmail = form.querySelector('input[name="email"]');
      if (prevMobile) prevMobile.remove();
      if (prevEmail) prevEmail.remove();
      if (!v) return;
      if (v.includes('@')) {
        const el = document.createElement('input');
        el.type = 'hidden';
        el.name = 'email';
        el.value = v;
        form.appendChild(el);
      } else {
        const el = document.createElement('input');
        el.type = 'hidden';
        el.name = 'mobile';
        el.value = v;
        form.appendChild(el);
      }
    });
  } catch (e) {
    // ignore
  }
})();
`,
        }}
      />
    </div>
  );
}
