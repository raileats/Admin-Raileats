// app/admin/login/layout.tsx
import React from "react";
import Image from "next/image";

export const metadata = {
  title: "Admin Login - RailEats",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Top small header with logo (left) */}
          <header className="flex items-center gap-3 py-6 px-4">
            <div className="flex items-center gap-3">
              {/* change src if your logo path is different */}
              <div style={{ width:48, height:48 }}>
                {/* using Image is optional; fallback to img if you prefer */}
                <Image src="/logo.png" alt="RailEats" width={48} height={48} />
              </div>
              <div>
                <div className="text-lg font-semibold">RailEats</div>
              </div>
            </div>
          </header>

          {/* center area */}
          <main className="px-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
