// app/admin/website/hero-slider/page.tsx

import HeroSliderManager from "@/components/admin/HeroSliderManager";

export const dynamic = "force-dynamic";

export default function HeroSliderPage() {
  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-1">🖼 Hero Slider</h1>

        <p className="text-muted mb-0">
          Manage homepage hero slider banners shown on the customer website.
        </p>
      </div>

      <HeroSliderManager />
    </div>
  );
}
