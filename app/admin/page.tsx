// app/admin/page.tsx
import { redirect } from "next/navigation";

export default function AdminRoot() {
  // If you want to show admin home directly:
  redirect("/admin/home");
}
