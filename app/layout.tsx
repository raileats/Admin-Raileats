// app/layout.tsx
import "../styles/globals.css";
import { Metadata } from "next";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "RailEats Admin",
  description: "RailEats Admin Panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="admin-shell d-flex">
          <Sidebar />
          <div className="main-content flex-grow-1">
            <Header />
            <div className="p-4">{children}</div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
  );
}
