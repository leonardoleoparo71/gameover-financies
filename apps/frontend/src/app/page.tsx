'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
          <Image src="/logo.webp" alt="GameOver" width={32} height={32} />
          GameOver
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.navLink}>Entrar</Link>
          <Link href="/register" className={styles.navButton}>Cadastrar</Link>
        </div>
      </header>

      <main className={styles.heroSection}>
        {/* Lado Esquerdo - Copywriting */}
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span role="img" aria-label="sparkles">✨</span> O Próximo Nível do Planejamento
          </div>
          
          <h1 className={styles.heroTitle}>Domine seu Dinheiro.<br/>Construa o Futuro.</h1>
          
          <p className={styles.heroSubtitle}>
            Pare de adivinhar e comece a agir. GameOver é a plataforma 
            estratégica definitiva projetada para quem busca alta performance.
          </p>

          <div className={styles.heroFeatures}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✔</div>
              Criptografia profunda zero-trust
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✔</div>
              Insights analíticos em tempo real
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✔</div>
              Orçamento inteligente automatizado
            </div>
          </div>

          <div className={styles.heroActions}>
            <Link href="/register" className={styles.btnPrimaryLarge}>
              Começar Grátis <span className={styles.arrowIcon}>→</span>
            </Link>
          </div>
        </div>

        {/* Lado Direito - Mockup Abstrato / Preview */}
        <div className={styles.heroVisual}>
          <div className={styles.glowBehind} />
          <div className={styles.mockupWindow}>
            <div className={styles.mockupHeader}>
              <div className={`${styles.dot} ${styles.red}`} />
              <div className={`${styles.dot} ${styles.yellow}`} />
              <div className={`${styles.dot} ${styles.green}`} />
            </div>
            <div className={styles.mockupBody}>
              <div className={styles.mockupFakeCards}>
                <div className={styles.mockupCard} />
                <div className={styles.mockupCard} />
                <div className={styles.mockupCard} />
              </div>
              <div className={styles.mockupFakeGraph} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
