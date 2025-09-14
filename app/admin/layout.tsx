// app/admin/layout.tsx
import { cookies } from 'next/headers';
import AdminUI from '@/components/admin/AdminUI';

export const metadata = { title: 'Admin' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value ?? null;

  return (
    <html lang="en">
      <body>
        <AdminUI token={token}>
          {children}
        </AdminUI>
      </body>
    </html>
  );
}
