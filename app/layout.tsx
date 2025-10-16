// app/layout.tsx
export const metadata = {
  title: "Raileats Admin",
  description: "Raileats admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
