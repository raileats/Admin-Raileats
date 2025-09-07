// app/admin/page.tsx
import { redirect } from "next/navigation";

export default function AdminRoot() {
  // send user to login by default; middleware will also handle auth checks
  redirect("/admin/login");
}
