import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>RailEats Admin</h2>
      <nav>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/orders">Orders</Link>
        <Link href="/admin/vendors">Vendors</Link>
        <Link href="/admin/menu">Menu</Link>
        <Link href="/admin/trains">Trains</Link>
        <Link href="/admin/stations">Stations</Link>
        <Link href="/admin/users">Users</Link>
        <Link href="/admin/logout">Logout</Link>
      </nav>
    </div>
  );
}