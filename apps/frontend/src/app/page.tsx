'use client';

import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landingWrapper}>
      <header className={styles.navbar}>
        <div className={styles.navLinks}>
          <Link href="/sobre" className={styles.navLink}>SOBRE</Link>
          <Link href="/login" className={styles.navLink}>ENTRAR</Link>
          <Link href="/register" className={styles.navLink}>CADASTRAR</Link>
        </div>
        <div className={styles.navLogo}>
          <img src="/logo.webp" alt="GameOver" width={32} height={32} />
        </div>
      </header>

      <main className={styles.heroSection}>
        <h1 className={styles.heroTitle}>GAMEOVER</h1>
        <p className={styles.heroSubtitle}>
          A jornada financeira não é para amadores. Assuma o controle,
          <br /> planeje seu futuro e torne-se o herói da sua economia.
        </p>

        <div className={styles.heroActions}>
          <Link href="/register" className={styles.btnPrimary}>
            CRIAR SUA CONTA
          </Link>
          <Link href="/login" className={styles.btnOutline}>
            ACESSAR PAINEL
          </Link>
        </div>
      </main>
    </div>
  );
}
