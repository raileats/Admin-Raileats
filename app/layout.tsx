// app/layout.tsx
import '../styles/globals.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Raileats Admin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        {/* header on top */}
        <Header userName="ops@raileats.in" />

        <div className="ra-shell d-flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
          {/* sidebar */}
          <aside className="d-none d-md-block" style={{ width: 240 }}>
            <Sidebar />
          </aside>

          {/* main content */}
          <main className="flex-grow-1 p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
