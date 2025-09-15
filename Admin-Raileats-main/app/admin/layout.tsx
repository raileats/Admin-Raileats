export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <div style={{ display: "flex" }}>
          <aside style={{ width: 220, borderRight: "1px solid #eee" }}>/* sidebar */</aside>
          <section style={{ flex: 1, padding: 16 }}>{children}</section>
        </div>
      </body>
    </html>
  );
}
