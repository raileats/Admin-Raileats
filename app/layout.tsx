// app/layout.tsx
import "./styles/raileats-tabs.css";

export const metadata = {
  title: "Raileats Admin",
  description: "Admin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
