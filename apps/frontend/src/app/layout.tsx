import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/AppShell/AppShell';
import GlobalLoader from '@/components/GlobalLoader/GlobalLoader';
import BackToTop from '@/components/BackToTop';

export const metadata: Metadata = {
  title: 'GameOver — Finanças Pessoais & Planejamento Visual',
  description: 'Controle seus gastos, planeje metas e visualize seu futuro financeiro.',
  icons: {
    icon: '/logo.webp',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <GlobalLoader>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <BackToTop />
          </AuthProvider>
        </GlobalLoader>
      </body>
    </html>
  );
}
