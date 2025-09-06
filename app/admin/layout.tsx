// app/admin/layout.tsx
import Sidebar from "../../components/Sidebar"; // components folder is at repo root
import "./admin-globals.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
          <Sidebar />

          <main style={{ flex: 1, padding: 24 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
