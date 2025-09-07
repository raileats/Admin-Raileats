// app/admin/login/layout.tsx

export const metadata = { title: "Admin Login" };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#f3f4f6",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          margin: 0,
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {children}
      </body>
    </html>
  );
}
