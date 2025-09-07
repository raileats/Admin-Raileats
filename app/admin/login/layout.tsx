// app/admin/login/layout.tsx
import "./login-globals.css";

export const metadata = { title: "Admin Login" };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ background: "#f3f4f6", minHeight: "100vh", display: "grid", placeItems: "center" }}>
        {children}
      </body>
    </html>
  );
}
