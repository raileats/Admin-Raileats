export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";
import { createClient } from "@supabase/supabase-js";

type OrderRow = Record<string, any>;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

const STATUS_LABELS = [
  "Booked",
  "In Verification",
  "New Order",
  "In Kitchen",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Not Delivered",
  "Bad Delivery",
];

function normalizeStatus(value: any, subStatus?: any) {
  const raw = String(value ?? "").trim().toLowerCase().replace(/[_-]/g, " ");
  const sub = String(subStatus ?? "").trim().toLowerCase();

  if (raw === "delivered" && sub === "bad delivery") return "Bad Delivery";
  if (raw === "bad delivery" || raw === "baddelivery") return "Bad Delivery";
  if (raw === "not delivered" || raw === "notdelivered") return "Not Delivered";
  if (raw === "cancelled" || raw === "canceled") return "Cancelled";
  if (raw === "out for delivery" || raw === "outfordelivery") return "Out for Delivery";
  if (raw === "in kitchen" || raw === "inkitchen") return "In Kitchen";
  if (raw === "new order" || raw === "neworder") return "New Order";
  if (raw === "verification" || raw === "in verification") return "In Verification";
  if (raw === "booked") return "Booked";
  if (raw === "delivered") return "Delivered";

  return raw ? raw.replace(/\b\w/g, (char) => char.toUpperCase()) : "Booked";
}

function getOrderDate(row: OrderRow) {
  return (
    row.CreatedAt ??
    row.createdAt ??
    row.created_at ??
    row.OrderDate ??
    row.orderDate ??
    row.DeliveryDate ??
    row.deliveryDate ??
    ""
  );
}

function indiaDateKey(value: any) {
  if (!value) return "";
  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  const text = String(value).trim();
  const ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  const dmy = text.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  return "";
}

function todayIndiaKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function countByStatus(rows: OrderRow[]) {
  const counts: Record<string, number> = {};
  for (const label of STATUS_LABELS) counts[label] = 0;

  for (const row of rows) {
    const status = normalizeStatus(
      row.Status ?? row.status ?? row.OrderStatus ?? row.orderStatus,
      row.SubStatus ?? row.subStatus
    );
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return counts;
}

function ChartCard({
  title,
  subtitle,
  counts,
}: {
  title: string;
  subtitle: string;
  counts: Record<string, number>;
}) {
  const entries = STATUS_LABELS.map((label) => ({ label, value: counts[label] ?? 0 }));
  const max = Math.max(1, ...entries.map((item) => item.value));

  return (
    <AdminCard title={title} subtitle={subtitle}>
      <div className="space-y-3">
        {entries.map((item) => (
          <div key={item.label} className="grid grid-cols-[140px_1fr_52px] items-center gap-3">
            <div className="text-xs font-semibold text-slate-600">{item.label}</div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              />
            </div>
            <div className="text-right text-sm font-bold text-slate-950">{item.value}</div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <AdminCard>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-bold text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{helper}</div>
    </AdminCard>
  );
}

async function fetchAllRows(table: string) {
  const pageSize = 1000;
  const rows: any[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(table).select("*").range(from, to);

    if (error) {
      console.error(`${table} load error:`, error.message);
      break;
    }

    const chunk = data ?? [];
    rows.push(...chunk);

    if (chunk.length < pageSize) break;
  }

  return rows;
}

function isActiveRestro(value: any) {
  return ["1", "true", "on", "active", "yes"].includes(
    String(value ?? "").trim().toLowerCase()
  );
}

async function getDashboardData() {
  const [restros, orders] = await Promise.all([
    fetchAllRows("RestroMaster"),
    fetchAllRows("Orders"),
  ]);

  const totalRestro = restros.length;
  const activeRestro = restros.filter((row) => isActiveRestro(row.RaileatsStatus)).length;
  const todayKey = todayIndiaKey();
  const todayOrders = orders.filter((row) => indiaDateKey(getOrderDate(row)) === todayKey);
  const allCounts = countByStatus(orders);
  const todayCounts = countByStatus(todayOrders);

  return {
    totalRestro,
    activeRestro,
    deactiveRestro: Math.max(0, totalRestro - activeRestro),
    totalOrders: orders.length,
    todayTotalOrders: todayOrders.length,
    cancelled: allCounts["Cancelled"] ?? 0,
    notDelivered: allCounts["Not Delivered"] ?? 0,
    badDelivery: allCounts["Bad Delivery"] ?? 0,
    allCounts,
    todayCounts,
    todayKey,
  };
}

export default async function AdminHome() {
  const data = await getDashboardData();

  return (
    <AdminPage title="Dashboard" subtitle="Live RailEats operations overview">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Restro" value={data.totalRestro} helper="All restaurants in RestroMaster" />
        <StatCard label="Active Restro" value={data.activeRestro} helper="RailEats status active" />
        <StatCard label="Deactive Restro" value={data.deactiveRestro} helper="RailEats status inactive" />
        <StatCard label="Today Total Orders" value={data.todayTotalOrders} helper={`Orders dated ${data.todayKey}`} />
        <StatCard label="Total Orders" value={data.totalOrders} helper="All orders till today" />
        <StatCard label="Cancelled" value={data.cancelled} helper="Cancelled orders till today" />
        <StatCard label="Not Delivered" value={data.notDelivered} helper="Not delivered orders till today" />
        <StatCard label="Bad Delivery" value={data.badDelivery} helper="Bad delivery orders till today" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Orders Till Today"
          subtitle="Status-wise all order graph"
          counts={data.allCounts}
        />
        <ChartCard
          title="Today Orders"
          subtitle="Status-wise graph for today only"
          counts={data.todayCounts}
        />
      </div>
    </AdminPage>
  );
}
