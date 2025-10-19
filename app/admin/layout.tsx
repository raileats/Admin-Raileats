// app/admin/layout.tsx
import React from "react";
import dynamic from "next/dynamic";
import { serviceClient, getServerClient } from "@/lib/supabaseServer";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

type Props = { children: React.ReactNode };

const AdminShell = dynamic(() => import("../../components/AdminShell"), { ssr: false });

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
    // 1) Try Supabase auth (cookie-aware)
    try {
      const supa = getServerClient();
      const { data: authData } = await supa.auth.getUser();
      const email = authData?.user?.email ?? null;
      if (email) {
        const { data: row, error } = await serviceClient
          .from("users")
          .select("id, user_id, user_type, name, mobile, photo_url, email")
          .eq("email", email)
          .limit(1)
          .single();

        if (!error && row) {
          currentUser = row;
        }
      }
    } catch (e) {
      // ignore and fallback to JWT
      console.debug("Supabase auth check failed (will try admin_auth cookie):", e);
    }

    // 2) If not found via Supabase, try admin_auth JWT cookie
    if (!currentUser) {
      const cookieStore = cookies();
      const token = cookieStore.get("admin_auth")?.value;
      if (token) {
        const secret = getJwtSecret();
        if (secret) {
          try {
            const payload = jwt.verify(token, secret) as any;
            // payload might contain email/mobile/user_id/uid
            const email = payload.email ?? null;
            const mobile = payload.mobile ?? null;
            const user_id = payload.user_id ?? null;
            const uid = payload.uid ?? null;

            let q = serviceClient.from("users").select("id, user_id, user_type, name, mobile, photo_url, email").limit(1);
            if (email) q = q.eq("email", email);
            else if (mobile) q = q.eq("mobile", mobile);
            else if (user_id) q = q.eq("user_id", user_id);
            else if (uid) q = q.eq("id", uid);

            const { data: row, error } = await q.single();
            if (!error && row) currentUser = row;
          } catch (err) {
            console.warn("admin_auth JWT invalid:", err);
          }
        } else {
          console.error("Missing JWT secret for admin_auth in AdminLayout.");
        }
      }
    }
  } catch (e) {
    console.error("AdminLayout get user error:", e);
    currentUser = null;
  }

  return (
    <html lang="en">
      <body>
        <AdminShell currentUser={currentUser}>{children}</AdminShell>
      </body>
    </html>
  );
}
