// app/layout.tsx
import "../styles/globals.css"; // optional – will work even if file empty
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raileats Admin",
  description: "Admin panel for Raileats orders & operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* --- Bootstrap CSS CDN --- */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-VkzK6pC+xYb2D7bZw3c0bl9P4Pgq6p9xT+9x3E6E7dAXiVtqPYV7GfE9mZAg/4K/"
          crossOrigin="anonymous"
        />
        {/* --- Font Awesome icons (optional) --- */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          integrity="sha512-0xYwKST7UQJcoOybLg9oWmkY1YrlZ5kOZzDgGyZ3A/0Ek5JZ6hjIS1d24zdbMyFJmS/6sOTsV0x6Y9N0I+waw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        {children}

        {/* --- Bootstrap JS Bundle (optional) --- */}
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-8sOfgQO1DdfN2nMi/2yq5v0QyK4QyWwsvmXYj3RjqmY2J6RMyC3Ssq9YhjFkz7+4"
          crossOrigin="anonymous"
        ></script>
      </body>
    </html>
  );
}
