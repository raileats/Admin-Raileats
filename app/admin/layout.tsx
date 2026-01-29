// app/admin/layout.tsx
import React from "react";
import dynamic from "next/dynamic";
import { serviceClient, getServerClient } from "@/lib/supabaseServer";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

type Props = { children: React.ReactNode };

const AdminShell = dynamic(() => import("@/components/AdminShell"), {
  ssr: false,
});

function getJwtSecret() {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ""
  );
}

export const metadata = {
  title: "RailEats Admin",
  description: "Admin dashboard",
};

export default async function AdminLayout({ children }: Props) {
  let currentUser: any = null;

  try {
    /* ================= TRY SUPABASE SESSION ================= */
    try {
      const supa = getServerClient();
      const { data } = await supa.auth.getUser();
      const email = data?.user?.email ?? null;

      if (email) {
        const { data: row, error } = await serviceClient
          .from("users")
          .select("id, user_id, user_type, name, mobile, photo_url, email")
          .eq("email", email)
          .single();

        if (!error && row) currentUser = row;
      }
    } catch {
      // silent fallback
    }

    /* ================= FALLBACK: admin_auth JWT ================= */
    if (!currentUser) {
      const token = cookies().get("admin_auth")?.value;
      if (token) {
        const secret = getJwtSecret();
        if (secret) {
          try {
            const payload = jwt.verify(token, secret) as any;

            let q = serviceClient
              .from("users")
              .select("id, user_id, user_type, name, mobile, photo_url, email")
              .limit(1);

            if (payload.email) q = q.eq("email", payload.email);
            else if (payload.mobile) q = q.eq("mobile", payload.mobile);
            else if (payload.user_id) q = q.eq("user_id", payload.user_id);
            else if (payload.uid) q = q.eq("id", payload.uid);

            const { data: row, error } = await q.single();
            if (!error && row) currentUser = row;
          } catch (e) {
            console.warn("Invalid admin_auth JWT", e);
          }
        }
      }
    }
  } catch (e) {
    console.error("AdminLayout error:", e);
    currentUser = null;
  }

  /* ❗ VERY IMPORTANT:
     ❌ DO NOT wrap html/body here
     ✅ Let app/layout.tsx handle it
  */
  return (
    <AdminShell currentUser={currentUser} requireAuth>
      {children}
    </AdminShell>
  );
}
