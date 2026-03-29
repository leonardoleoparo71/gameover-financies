'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './landing.module.css';

export default function LandingPage() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <LoadingScreen onFinished={() => setLoading(false)} />;
  }

  return (
    <div className={styles.landingWrapper}>
      <header className={styles.navbar}>
        <div className={styles.navLogo}>
          <img src="/logo.webp" alt="GameOver" width={40} height={40} />
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.navLink}>ENTRAR</Link>
          <Link href="/register" className={styles.navLink}>CADASTRAR</Link>
        </div>
      </header>

      <main className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>GAMEOVER</h1>
          <p className={styles.heroSubtitle}>
            Domine suas finanças, vença o jogo do dinheiro e alcance sua liberdade. 
            A estratégia definitiva para o seu sucesso financeiro.
          </p>

          <div className={styles.heroActions}>
            <Link href="/register" className={styles.btnPrimary}>
              GARANTA SEU ACESSO
            </Link>
            <Link href="/login" className={styles.btnOutline}>
              ACESSAR PAINEL
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
