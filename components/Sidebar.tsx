// components/Sidebar.tsx
import Link from "next/link";

export default function Sidebar(){
  return (
    <aside style={{ width:240, padding:20 }}>
      <h3>RailEats</h3>
      <nav>
        <ul style={{ listStyle:"none", padding:0 }}>
          <li><Link href="/admin/home">Home</Link></li>
          <li><Link href="/admin/orders">Orders</Link></li>
          <li><Link href="/admin/menu">Menu</Link></li>
          <li><Link href="/admin/trains">Trains</Link></li>
        </ul>
      </nav>
    </aside>
  );
}
