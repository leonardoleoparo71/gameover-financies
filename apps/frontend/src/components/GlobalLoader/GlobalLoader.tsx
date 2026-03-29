'use client';

import { useEffect, useState } from 'react';
import styles from './GlobalLoader.module.css';

export default function GlobalLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 15) + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => setLoading(false), 400); // slight delay after reaching 100%
      }
      setProgress(current);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  if (!loading) return <>{children}</>;

  return (
    <div className={styles.loaderContainer}>
      <div className={styles.logoWrapper}>
        <img src="/logo.webp" alt="Loading..." className={styles.loaderLogo} />
        <div className={styles.progressTrack}>
           <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className={styles.percentage}>{progress}%</div>
    </div>
  );
}
