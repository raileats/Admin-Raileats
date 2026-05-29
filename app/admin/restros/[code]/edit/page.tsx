// app/admin/restros/[code]/edit/page.tsx
import { redirect } from "next/navigation";

type Props = {
  params: { code: string };
};

export default function RestroEditIndexPage({ params }: Props) {
  redirect(`/admin/restros/${encodeURIComponent(params.code)}/edit/basic`);
}
