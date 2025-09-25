// app/layout.tsx
// Restore your global CSS and also include the raileats tabs CSS we added.
// Adjust the first import path if your global stylesheet is located elsewhere.

import "./globals.css";                // <- your main global stylesheet (exists in many Next apps)
import "./styles/raileats-tabs.css";   // <- the normalization we added for the modal tabs

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
