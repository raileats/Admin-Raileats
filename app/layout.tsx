// app/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Raileats Admin',
  description: 'Raileats admin panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Bootstrap CSS CDN — immediate styling */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          integrity="sha384-...replace-if-needed..." // optional
          crossOrigin="anonymous"
        />
        {/* Optional: font awesome for icons if used */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          integrity="sha512-...replace-if-needed..."
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        {children}
        {/* Bootstrap JS (optional; put at end) */}
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
  );
}
