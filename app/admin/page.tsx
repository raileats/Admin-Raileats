import { redirect } from "next/navigation";

export default function AdminRoot() {
  // You can check server side auth here (cookies) and redirect to login if needed.
  // For simple: redirect to /admin/home
  redirect("/admin/home");
}
