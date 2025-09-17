// pages/admin/restros/[code]/edit/station-settings.tsx
import React from "react";
import { useRouter } from "next/router";
import RestroEditModal from "@/components/RestroEditModal";

const StationSettingsPage = ({ restro, stationsOptions }: any) => {
  const router = useRouter();
  return (
    <div>
      <RestroEditModal restro={restro ?? {}} onClose={() => router.push("/admin/restros")} stationsOptions={stationsOptions} />
    </div>
  );
};

export async function getServerSideProps(context: any) {
  const { code } = context.params;
  const base = process.env.NEXT_PUBLIC_SITE_BASE_URL ?? "";
  const res = await fetch(`${base}/api/restros/${encodeURIComponent(String(code))}`);
  const json = await res.json().catch(() => null);
  const restro = json?.row ?? json ?? null;

  // fetch stations for dropdown (optional)
  let stationsOptions = [];
  try {
    const sres = await fetch(`${base}/api/stations`);
    const sj = await sres.json().catch(() => null);
    const rows = Array.isArray(sj) ? sj : sj?.data ?? sj?.rows ?? [];
    stationsOptions = (rows || []).map((r: any) => ({
      label: `${r.StationName ?? r.station_name ?? ""} (${r.StationCode ?? r.station_code ?? ""})${r.State ? " - " + r.State : ""}`,
      value: r.StationCode ?? r.station_code,
    }));
  } catch (err) {}

  return { props: { restro, stationsOptions } };
}

export default StationSettingsPage;
