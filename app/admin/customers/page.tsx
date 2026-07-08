import { serviceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type CustomerRow = {
  customer_id: string | number | null;
  mobile: string | number | null;
  name: string | null;
  email: string | null;
  wallet_balance: string | number | null;
  last_login_at: string | null;
  created_at: string | null;
  user_type_agent: string | null;
  active: boolean | string | number | null;
};

type PageProps = {
  searchParams?: {
    customer_id?: string;
    mobile?: string;
    name?: string;
    email?: string;
  };
};

function formatMobile(value: string | number | null) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits || "-";
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);

  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text.slice(0, 16);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatWallet(value: string | number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0";
  return amount.toFixed(2).replace(/\.00$/, "");
}

function isActiveCustomer(value: CustomerRow["active"]) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const text = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "active", "yes"].includes(text);
}

function normalizeSearch(value?: string) {
  return String(value || "").trim();
}

async function getCustomers(searchParams: PageProps["searchParams"]) {
  const customerId = normalizeSearch(searchParams?.customer_id);
  const mobile = normalizeSearch(searchParams?.mobile).replace(/\D/g, "");
  const name = normalizeSearch(searchParams?.name);
  const email = normalizeSearch(searchParams?.email);

  let query = serviceClient
    .from("customers")
    .select(
      "customer_id,mobile,name,email,wallet_balance,last_login_at,created_at,user_type_agent,active",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  if (mobile) {
    const mobileWithCountryCode =
      mobile.length === 10 ? `91${mobile}` : mobile;
    query = query.ilike("mobile", `%${mobileWithCountryCode}%`);
  }

  if (name) {
    query = query.ilike("name", `%${name}%`);
  }

  if (email) {
    query = query.ilike("email", `%${email}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("ADMIN CUSTOMERS FETCH ERROR:", error);
    return {
      customers: [] as CustomerRow[],
      error: "Unable to load customers right now.",
    };
  }

  return {
    customers: (Array.isArray(data) ? data : []) as CustomerRow[],
    error: "",
  };
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const { customers, error } = await getCustomers(searchParams);
  const customerId = normalizeSearch(searchParams?.customer_id);
  const mobile = normalizeSearch(searchParams?.mobile);
  const name = normalizeSearch(searchParams?.name);
  const email = normalizeSearch(searchParams?.email);

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-950">Customers</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Manage registered customer master data
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-7">
          <h2 className="text-xl font-black text-slate-900">
            Customers Management
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Showing {customers.length} customer records
          </p>
        </div>

        <form className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
          <SearchField
            label="Search by Customer ID"
            name="customer_id"
            placeholder="Customer ID"
            defaultValue={customerId}
          />
          <SearchField
            label="Search by Mobile"
            name="mobile"
            placeholder="Mobile"
            defaultValue={mobile}
          />
          <SearchField
            label="Search by Name"
            name="name"
            placeholder="Name"
            defaultValue={name}
          />
          <SearchField
            label="Search by Email"
            name="email"
            placeholder="Email"
            defaultValue={email}
          />

          <div className="flex items-end">
            <a
              href="/admin/customers"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </a>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>

        {error ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <TableHead>Customer Id</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Last Login At</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>User Type Agent</TableHead>
                  <TableHead>Active</TableHead>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr
                    key={`${customer.customer_id ?? customer.mobile}-${index}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                  >
                    <TableCell strong>{customer.customer_id ?? "-"}</TableCell>
                    <TableCell>{formatMobile(customer.mobile)}</TableCell>
                    <TableCell>{customer.name || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>Rs {formatWallet(customer.wallet_balance)}</TableCell>
                    <TableCell>{formatDateTime(customer.last_login_at)}</TableCell>
                    <TableCell>{formatDateTime(customer.created_at)}</TableCell>
                    <TableCell>{customer.user_type_agent || "-"}</TableCell>
                    <TableCell>
                      <form action="/api/admin/customers/status" method="POST">
                        <input
                          type="hidden"
                          name="customer_id"
                          value={String(customer.customer_id ?? "")}
                        />
                        <input
                          type="hidden"
                          name="active"
                          value={isActiveCustomer(customer.active) ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          aria-label={
                            isActiveCustomer(customer.active)
                              ? "Set customer inactive"
                              : "Set customer active"
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            isActiveCustomer(customer.active)
                              ? "bg-emerald-500"
                              : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                              isActiveCustomer(customer.active)
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </form>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SearchField({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-600">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-amber-100 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-slate-200 px-3 py-3 text-left text-sm font-black text-slate-700">
      {children}
    </th>
  );
}

function TableCell({
  children,
  strong,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`border border-slate-200 px-3 py-4 align-top ${
        strong ? "font-black text-slate-900" : "font-semibold text-slate-700"
      }`}
    >
      {children}
    </td>
  );
}
