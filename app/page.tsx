// app/page.tsx
import { redirect } from "next/navigation";

export const metadata = {
  title: "Raileats Admin Redirect",
  description: "Redirects root domain to Admin dashboard",
};

// ✅ permanent redirect to /admin
export default function RootRedirect() {
  redirect("/admin");
}
