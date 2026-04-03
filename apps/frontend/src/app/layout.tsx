import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/AppShell/AppShell';
import GlobalLoader from '@/components/GlobalLoader/GlobalLoader';
import BackToTop from '@/components/BackToTop';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'mock_client_id'}>
              <AppShell>{children}</AppShell>
              <BackToTop />
              <Toaster theme="dark" position="top-right" richColors />
            </GoogleOAuthProvider>
          </AuthProvider>
        </GlobalLoader>
      </body>
    </html>
  );
}
