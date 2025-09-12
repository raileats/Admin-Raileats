// components/Sidebar.tsx
import Link from "next/link";
import Image from "next/image";

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        padding: 20,
        background: "black",
        color: "white",
        minHeight: "100vh",
      }}
    >
      {/* Logo + Title */}
      <div className="flex items-center gap-2 mb-8">
        <Image
          src="/logo.png" // <-- aapne /public/logo.png upload kar diya ho
          alt="RailEats"
          width={40}
          height={40}
          className="rounded-full animate-bubbleGlow"
        />
        <span className="text-xl font-bold leading-none">
          <span className="text-[#F6C800]">Rail</span>
          <span className="text-white">Eats</span>
        </span>
      </div>

      {/* Navigation */}
      <nav>
        <ul className="space-y-4">
          <li>
            <Link href="/admin/home" className="hover:text-[#F6C800]">
              Home
            </Link>
          </li>
          <li>
            <Link href="/admin/orders" className="hover:text-[#F6C800]">
              Orders
            </Link>
          </li>
          <li>
            <Link href="/admin/menu" className="hover:text-[#F6C800]">
              Menu
            </Link>
          </li>
          <li>
            <Link href="/admin/trains" className="hover:text-[#F6C800]">
              Trains
            </Link>
          </li>
          <li>
            <Link href="/admin/stations" className="hover:text-[#F6C800]">
              Stations
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className="hover:text-[#F6C800]">
              Users
            </Link>
          </li>
          <li>
            <Link href="/admin/vendors" className="hover:text-[#F6C800]">
              Vendors
            </Link>
          </li>
          <li>
            <Link href="/admin/logout" className="hover:text-red-400">
              Logout
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
