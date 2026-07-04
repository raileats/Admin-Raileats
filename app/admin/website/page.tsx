// app/admin/website/page.tsx

import Link from "next/link";

const modules = [
  {
    title: "Hero Slider",
    description: "Manage homepage hero slider banners.",
    href: "/admin/website/hero-slider",
    icon: "🖼️",
    active: true,
  },
  {
    title: "Homepage Popup",
    description: "Manage homepage popup banner.",
    href: "#",
    icon: "📢",
    active: false,
  },
  {
    title: "Announcement Bar",
    description: "Manage top announcement bar.",
    href: "#",
    icon: "📣",
    active: false,
  },
  {
    title: "Offers Banner",
    description: "Manage homepage offer banners.",
    href: "#",
    icon: "🎁",
    active: false,
  },
  {
    title: "SEO Settings",
    description: "Manage Meta Title, Description & OG Image.",
    href: "#",
    icon: "🔍",
    active: false,
  },
  {
    title: "FAQs",
    description: "Manage website FAQ section.",
    href: "#",
    icon: "❓",
    active: false,
  },
  {
    title: "Contact Details",
    description: "Manage website contact information.",
    href: "#",
    icon: "☎️",
    active: false,
  },
  {
    title: "Social Media",
    description: "Manage website social media links.",
    href: "#",
    icon: "🌐",
    active: false,
  },
];

export default function WebsiteCMSPage() {
  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-1">🌐 Website CMS</h1>
        <p className="text-muted mb-0">
          Manage all customer website content from one place.
        </p>
      </div>

      <div className="row g-4">
        {modules.map((item) => (
          <div className="col-xl-3 col-lg-4 col-md-6" key={item.title}>
            {item.active ? (
              <Link
                href={item.href}
                className="text-decoration-none text-dark"
              >
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <div style={{ fontSize: 40 }}>{item.icon}</div>

                    <h5 className="mt-3 mb-2 fw-bold">
                      {item.title}
                    </h5>

                    <p className="text-muted mb-3">
                      {item.description}
                    </p>

                    <span className="btn btn-primary btn-sm">
                      Open Module
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div style={{ fontSize: 40 }}>{item.icon}</div>

                  <h5 className="mt-3 mb-2 fw-bold">
                    {item.title}
                  </h5>

                  <p className="text-muted mb-3">
                    {item.description}
                  </p>

                  <span className="badge bg-secondary">
                    Coming Soon
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
