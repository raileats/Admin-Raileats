// app/admin/restros/[code]/edit/menu/page.tsx
import MenuTab from "@/components/restro-edit/MenuTab";

export default function MenuPage({ params }: { params: { code: string } }) {
  return <MenuTab restroCode={params.code} />;
}
