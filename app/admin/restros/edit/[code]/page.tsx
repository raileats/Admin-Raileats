// app/admin/restros/edit/[code]/page.tsx
import RestroEditPageClient from "@/components/RestroEditPageClient";

export default function RestroEditPage({ params }: { params: { code: string } }) {
  const { code } = params;

  return (
    <div style={{ padding: 20 }}>
      <RestroEditPageClient code={code} />
    </div>
  );
}
