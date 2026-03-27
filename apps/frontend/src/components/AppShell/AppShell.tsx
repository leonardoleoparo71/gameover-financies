'use client';

import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar/Sidebar';
import { usePathname } from 'next/navigation';

const PUBLIC_ROUTES = ['/', '/login', '/register'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-base)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}><img src="/logo.webp" alt="GameOver" width={48} height={48} /></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Carregando GameOver...</p>
        </div>
      </div>
    );
  }

  if (isPublic || !user) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
