// app/admin/restros/[code]/edit/page.tsx
import { redirect } from "next/navigation";

export default function RestroEditIndexPage({ params }: { params: { code: string } }) {
  redirect(`/admin/restros/${encodeURIComponent(params.code)}/edit/basic`);
}
