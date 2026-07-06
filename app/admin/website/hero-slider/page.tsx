import HeroSliderManager from "@/components/admin/HeroSliderManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hero Slider Manager | RailEats Admin",
};

export default function HeroSliderAdminPage() {
  return (
    <main className="container-fluid py-4">
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Hero Slider</h1>
        <p className="text-muted mb-0">
          Manage homepage slider images, ordering and visibility.
        </p>
      </div>

      <HeroSliderManager />
    </main>
  );
}
