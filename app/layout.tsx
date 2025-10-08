// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "RailEats Admin",
  description: "Admin panel for RailEats restaurant management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
