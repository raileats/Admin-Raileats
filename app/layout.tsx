// app/layout.tsx (server)
import "../styles/globals.css";
import { Metadata } from "next";
import LayoutShell from "./components/LayoutShell";

export const metadata: Metadata = {
  title: "RailEats Admin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body>
        <LayoutShell>{children}</LayoutShell>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
  );
}
