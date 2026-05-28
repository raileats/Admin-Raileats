// app/admin/login/page.tsx
"use client";

import React, { useState } from "react";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 5000);
  }

  const mobileVal = identifier && !identifier.includes("@") ? identifier.trim() : "";
  const emailVal = identifier && identifier.includes("@") ? identifier.trim() : "";

  return (
    <div className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-8">
      <form
        method="post"
        action="/api/auth/login"
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-md border border-slate-200 bg-white p-7 shadow-sm"
        aria-label="Admin login form"
      >
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="RailEats" className="mx-auto h-14 w-14 rounded-md object-contain" />
          <h1 className="mt-3 text-2xl font-bold text-slate-950">RailEats Admin</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Sign in to the operations console
          </p>
        </div>

        <label className="mb-1 block text-xs font-semibold text-slate-600">
          User ID (mobile or email)
        </label>
        <input
          name="identifier"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="8888888888 or name@example.com"
        />

        <input type="hidden" name="mobile" value={mobileVal} />
        <input type="hidden" name="email" value={emailVal} />

        <label className="mb-1 mt-4 block text-xs font-semibold text-slate-600">
          Password
        </label>
        <div className="flex gap-2">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 h-10 w-full rounded-md border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>

        <p className="mt-4 text-center text-xs font-medium text-slate-500">
          Please use your admin credentials.
        </p>
      </form>
    </div>
  );
}
