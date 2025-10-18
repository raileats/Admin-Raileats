// app/admin/layout.tsx
import React from "react";
import dynamic from "next/dynamic";
import { getServerClient, serviceClient } from "@/lib/supabaseServer";

type Props = { children: React.ReactNode };

// Dynamically import the client AdminShell with SSR disabled
const AdminShell = dynamic(() => import("../../components/AdminShell"), {
  ssr: false,
});

export const metadata = {
  title: "RailEats Admin",
  description: "Admin dashboard",
};

export default async function AdminLayout({ children }: Props) {
  // server-side: get supabase client that reads cookies
  let currentUser: any = null;
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

      if (!error) currentUser = row ?? null;
    }
  } catch (e) {
    // keep server-side errors quiet but log for debugging
    console.error("AdminLayout get user error:", e);
    currentUser = null;
  }

  // Render client-side AdminShell (ssr: false) and pass currentUser
  return (
    <html lang="en">
      <body>
        <AdminShell currentUser={currentUser}>{children}</AdminShell>
      </body>
    </html>
  );
}
