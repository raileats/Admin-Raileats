"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/db"; // supabase import
import OutletsList from "@/components/OutletsList";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) {
          console.error("Supabase client not initialized");
          return;
        }

        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.warn("Error getting user:", error.message);
          return;
        }

        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.warn("getUser error", err);
      }
    })();
  }, []);

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <OutletsList />
        </div>
      ) : (
        <p>Loading user...</p>
      )}
    </div>
  );
}
