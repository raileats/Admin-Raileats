// app/admin/website/hero-slider/page.tsx

export const dynamic = "force-dynamic";

export default function HeroSliderPage() {
  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-1">🖼 Hero Slider</h1>

        <p className="text-muted mb-0">
          Hero Slider module is currently unavailable.
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          textAlign: "center",
        }}
      >
        <h3 style={{ marginBottom: 10 }}>Coming Soon</h3>

        <p style={{ color: "#6b7280", margin: 0 }}>
          Hero Slider Manager has not been added to this project yet.
        </p>
      </div>
    </div>
  );
}
