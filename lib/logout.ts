// lib/logout.ts
"use client";
import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      router.push("/admin/login");
    }
  }
  return { logout };
}
