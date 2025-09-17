"use client";

import { useEffect, useState } from "react";
import RestroEditModal from "@/components/RestroEditModal";

export default function RestroEditPageClient({ code }: { code: string }) {
  const [restro, setRestro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRestro() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/restros/${code}`);
        if (!res.ok) throw new Error(`Failed to fetch Restro ${code}`);
        const data = await res.json();
        setRestro(data);
      } catch (err: any) {
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchRestro();
  }, [code]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!restro) return <p>No data found for {code}</p>;

  return (
    <RestroEditModal
      restro={restro}
      onClose={() => {
        // deep link वाले case में modal close करने पर बस back करें
        window.location.href = "/admin/restros";
      }}
      isPage
    />
  );
}
