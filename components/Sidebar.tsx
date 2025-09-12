// components/Sidebar.tsx
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside
      className="w-60 h-screen bg-black text-white flex flex-col p-5"
    >
      {/* Logo + Title */}
      <div className="flex items-center gap-3 mb-10">
        <img
          src="/logo.png"
          alt="RailEats"
          className="h-10 w-10 rounded-full"
        />
        <span className="text-xl font-bold leading-none">
          <span className="text-[#F6C800]">Rail</span>
          <span className="text-white">Eats</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-4">
        <Link
          href="/admin/home"
          className="hover:text-[#F6C800] transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/orders"
          className="hover:text-[#F6C800] transition-colors"
        >
          Orders
        </Link>
        <Link
          href="/admin/menu"
          className="hover:text-[#F6C800] transition-colors"
        >
          Menu
        </Link>
        <Link
          href="/admin/trains"
          className="hover:text-[#F6C800] transition-colors"
        >
          Trains
        </Link>
        <Link
          href="/admin/stations"
          className="hover:text-[#F6C800] transition-colors"
        >
          Stations
        </Link>
        <Link
          href="/admin/users"
          className="hover:text-[#F6C800] transition-colors"
        >
          Users
        </Link>
        <Link
          href="/admin/logout"
          className="mt-6 text-red-400 hover:text-red-500 transition-colors"
        >
          Logout
        </Link>
      </nav>
    </aside>
  );
}
