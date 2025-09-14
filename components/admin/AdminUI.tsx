'use client';

export default function AdminUI({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <header>Admin Panel – {token ? 'Logged in' : 'Guest'}</header>
      {children}
    </div>
  );
}
