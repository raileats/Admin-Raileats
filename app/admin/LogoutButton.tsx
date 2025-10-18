// app/admin/LogoutButton.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      // 🔹 Call your API route to clear session/cookie
      const res = await fetch("/api/auth/logout", { method: "POST" });

      // ✅ Regardless of response, navigate to login page
      router.replace("/admin/login");
    } catch (err) {
      console.error("Logout error:", err);
      router.replace("/admin/login"); // fallback redirect
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        border: "none",
        background: "transparent",
        color: "#0070f3",
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
