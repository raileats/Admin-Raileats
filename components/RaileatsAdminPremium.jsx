/* components/RaileatsAdminPremium.jsx
   Requires: lucide-react
   Usage: import RaileatsAdminPremium from '@/components/RaileatsAdminPremium'
*/
import React, { useEffect, useState } from "react";
import {
  Home, ShoppingCart, Users, Settings, Bell, Search, Sun, Moon, MoreHorizontal,
  CheckCircle, XCircle, Box, Clock
} from "lucide-react";

export default function RaileatsAdminPremium() {
  // theme (persist)
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("raileats-theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      if (dark) root.classList.add("dark"); else root.classList.remove("dark");
      localStorage.setItem("raileats-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  // sample orders — replace with fetch from /api/test-db or supabase
  const [orders, setOrders] = useState(sampleOrders());
  const [detailOrder, setDetailOrder] = useState(null); // order for slide-over

  // actions
  const updateStatus = (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#071018] text-slate-900 dark:text-slate-100 font-inter">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header dark={dark} setDark={setDark} />
          <main className="p-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI title="Orders Today" value={orders.length} icon={<ShoppingCart />} accent />
                <KPI title="Active Riders" value={12} icon={<Users />} />
                <KPI title="Pending" value={orders.filter(o => o.status==='Pending').length} icon={<Clock />} />
                <KPI title="Revenue (MTD)" value={`₹ ${formatNumber(125540)}`} icon={<Box />} />
              </div>

              {/* Orders panel */}
              <section className="bg-white dark:bg-[#071827] rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-semibold">Orders</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2 text-slate-400" size={16}/>
                      <input placeholder="Search order, customer or id..." 
                             className="pl-10 pr-3 py-2 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50 dark:bg-[#071324] text-sm w-72"/>
                    </div>
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 text-black font-medium shadow-btn hover:bg-amber-300 transition">New Order</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto min-w-[900px]">
                    <thead className="text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="text-left p-3">Order</th>
                        <th className="text-left p-3">Customer</th>
                        <th className="text-left p-3">Items</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {orders.map(order => (
                        <tr key={order.id} className="border-t last:border-b hover:bg-slate-50 dark:hover:bg-[#06121a] transition">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-amber-50 dark:bg-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-300 font-semibold">
                                #{order.id.toString().slice(-4)}
                              </div>
                              <div>
                                <div className="font-medium">#{order.id}</div>
                                <div className="text-xs text-slate-400">{order.time}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">{order.customer}<div className="text-xs text-slate-400">{order.phone}</div></td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{order.itemsSummary}</td>
                          <td className="p-3 font-medium">₹ {order.amount}</td>

                          <td className="p-3">
                            <StatusBadge status={order.status}/>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { updateStatus(order.id, 'Accepted'); }} className="px-3 py-1 rounded-md bg-amber-400 text-black text-sm font-medium hover:bg-amber-300 transition">Accept</button>
                              <button onClick={() => { updateStatus(order.id, 'Ready'); }} className="px-3 py-1 rounded-md border border-slate-200 text-sm hover:bg-slate-100 transition">Ready</button>
                              <button onClick={() => { updateStatus(order.id, 'Cancelled'); }} className="px-3 py-1 rounded-md bg-red-500 text-white text-sm hover:bg-red-400 transition">Cancel</button>
                              <button onClick={() => setDetailOrder(order)} className="p-2 rounded-md border bg-transparent"><MoreHorizontal size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* Slide-over detail */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailOrder(null)} />
          <aside className="ml-auto w-full max-w-md bg-white dark:bg-[#071824] p-6 shadow-2xl overflow-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Order #{detailOrder.id}</h3>
                <p className="text-sm text-slate-500 mt-1">{detailOrder.customer} • {detailOrder.phone}</p>
              </div>
              <button onClick={() => setDetailOrder(null)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-[#08121a]"><XCircle size={20}/></button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-sm text-slate-400">Items</div>
              <div className="space-y-2">
                {detailOrder.items.map((it,i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>{it.name} <span className="text-xs text-slate-400">x{it.qty}</span></div>
                    <div className="text-sm font-medium">₹ {it.price}</div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#08202a]">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">Subtotal</div>
                  <div className="font-medium">₹ {detailOrder.amount}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => { updateStatus(detailOrder.id, 'Accepted'); setDetailOrder(null); }} className="flex-1 px-4 py-2 rounded-lg bg-amber-400 text-black font-medium">Accept</button>
                <button onClick={() => { updateStatus(detailOrder.id, 'Cancelled'); setDetailOrder(null); }} className="px-4 py-2 rounded-lg bg-red-500 text-white">Cancel</button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ---------- subcomponents ---------- */

function Sidebar(){
  const nav = [
    {name:'Dashboard', icon:<Home size={18}/>},
    {name:'Orders', icon:<ShoppingCart size={18}/>},
    {name:'Riders', icon:<Users size={18}/>},
    {name:'Settings', icon:<Settings size={18}/>},
  ];
  return (
    <aside className="w-72 bg-white dark:bg-[#03141a] border-r border-slate-100 dark:border-[#042027] min-h-screen p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-amber-400 flex items-center justify-center font-bold text-black">R</div>
        <div>
          <div className="text-lg font-semibold">Raileats Admin</div>
          <div className="text-xs text-slate-400">Orders & Operations</div>
        </div>
      </div>

      <nav className="space-y-1">
        {nav.map((n, i) => (
          <a key={n.name} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#041827] ${i===1 ? 'bg-[#FFF8E1] dark:bg-[#08303b]' : ''}`}>
            <span className="w-6 h-6 flex items-center justify-center">{n.icon}</span>
            <span className="font-medium">{n.name}</span>
          </a>
        ))}
      </nav>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#042026]">
        <div className="flex items-center gap-3">
          <img src="https://i.pravatar.cc/40" alt="admin" className="w-10 h-10 rounded-full"/>
          <div>
            <div className="font-medium">Admin Name</div>
            <div className="text-xs text-slate-400">ops@raileats.in</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Header({dark, setDark}) {
  return (
    <header className="bg-transparent p-4 border-b border-slate-100 dark:border-[#05121a]">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="text-lg font-semibold">Admin Panel</div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-[#04121a]"><Bell size={18}/></button>
          <div className="w-8 h-8 rounded-full overflow-hidden"><img alt="avatar" src="https://i.pravatar.cc/40" /></div>
          <button onClick={() => setDark(!dark)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-[#04121a]">
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
        </div>
      </div>
    </header>
  );
}

function KPI({title, value, icon, accent}) {
  return (
    <div className={`rounded-xl p-4 bg-white dark:bg-[#071827] shadow-card flex items-center gap-4 ${accent ? 'border-l-4 border-amber-400' : ''}`}>
      <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-800 text-amber-600">{icon}</div>
      <div>
        <div className="text-xs text-slate-400">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({status}) {
  const m = {
    Pending: {bg: "bg-yellow-50 text-yellow-800", label: "Pending"},
    Accepted: {bg: "bg-green-50 text-green-800", label: "Accepted"},
    Ready: {bg: "bg-amber-50 text-amber-800", label: "Ready"},
    Cancelled: {bg: "bg-red-50 text-red-700", label: "Cancelled"},
  };
  const s = m[status] || m.Pending;
  return <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${s.bg}`}>{s.label}</span>;
}

/* ---------- sample data ---------- */
function sampleOrders(){
  return [
    { id: 10234, customer: 'Rahul Kumar', phone: '98973xxxx', itemsSummary: 'Veg Biryani x1, Coke', amount: 420, status: 'Pending', time: '10:32 AM', items: [{name:'Veg Biryani', qty:1, price:300},{name:'Coke',qty:1,price:40}] },
    { id: 10235, customer: 'Suman Reddy', phone: '99887xxxx', itemsSummary: 'Paneer Butter Masala x2', amount: 780, status: 'Accepted', time: '10:45 AM', items: [{name:'Paneer',qty:2,price:780}] },
    { id: 10236, customer: 'Aisha Khan', phone:'97766xxxx', itemsSummary: 'Cheese Pizza x1', amount: 350, status: 'Ready', time: '11:05 AM', items: [{name:'Pizza',qty:1,price:350}] },
  ];
}

function formatNumber(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
