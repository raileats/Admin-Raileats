// app/admin/restros/[code]/edit/station-settings/page.tsx
import React from "react";
import RestroEditModal from "@/components/RestroEditModal"; // adjust path if needed
import type { Metadata } from "next";

type Props = { params: { code: string } };

export const metadata: Metadata = {
  title: "Edit Restro - Station Settings",
};

export default async function Page({ params }: Props) {
  const code = params.code;

  // server-side fetch from your internal API route that returns restro object
  // Ensure /api/restros/[code] returns JSON { ok: true, row: {...} } or similar.
  const base = process.env.NEXT_PUBLIC_SITE_BASE_URL ?? ""; // optional
  const url = `${base}/api/restros/${encodeURIComponent(String(code))}`;
  let restro: any = null;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      // either json.row or json
      restro = json?.row ?? json ?? null;
    } else {
      // fallback: try to parse body
      const txt = await res.text().catch(() => "");
      console.error("Fetch restro failed:", res.status, txt);
    }
  } catch (err) {
    console.error("Fetch restro error:", err);
  }

  // optional: build stationsOptions server-side (if you have stations API)
  let stationsOptions: Array<{ label: string; value: string }> = [];
  try {
    const sres = await fetch(`${base}/api/stations`, { cache: "no-store" });
    if (sres.ok) {
      const j = await sres.json().catch(() => null);
      const rows = Array.isArray(j) ? j : j?.data ?? j?.rows ?? [];
      stationsOptions = (rows || []).map((r: any) => {
        const name = r.StationName ?? r.station_name ?? r.name ?? "";
        const code = r.StationCode ?? r.station_code ?? r.code ?? "";
        const state = r.State ?? r.state ?? r.state_name ?? "";
        return { label: `${name} (${code})${state ? " - " + state : ""}`, value: code };
      });
    }
  } catch (err) {
    // ignore
  }

  // Render client component (RestroEditModal expects client usage)
  // We render inside a wrapper so modal UX looks similar to your other screens
  return (
    <div>
      {/* You can render a header or keep blank so modal overlays */}
      <RestroEditModal restro={restro ?? {}} onClose={() => { /* client-side navigation will handle close */ }} stationsOptions={stationsOptions} />
      <script
        // small client-side script to switch modal to "Station Settings" tab after mount
        // (RestroEditModal sets activeTab internally; if you want to force tab, you can add a prop to RestroEditModal)
        dangerouslySetInnerHTML={{
          __html: `/* no-op */`,
        }}
      />
    </div>
  );
}
