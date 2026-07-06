import HeroSliderManager from "@/components/admin/HeroSliderManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hero Slider Manager | RailEats Admin",
};

export default function HeroSliderAdminPage() {
  return (
    <main
      style={{
        width: "100%",
        maxWidth: 1180,
        margin: "0 auto",
        padding: "32px 18px 56px",
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <p
          style={{
            margin: "0 0 6px",
            color: "#d97706",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Website CMS
        </p>
        <h1
          style={{
            margin: 0,
            color: "#111827",
            fontSize: 30,
            lineHeight: 1.15,
            fontWeight: 900,
          }}
        >
          Hero Slider
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            color: "#64748b",
            fontSize: 15,
          }}
        >
          Manage homepage slider images, ordering and visibility.
        </p>
      </div>

      <HeroSliderManager />
    </main>
  );
}
