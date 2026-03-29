'use client';

import { useEffect, useState } from 'react';
import styles from './GlobalLoader.module.css';
import Image from 'next/image';

export default function GlobalLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      // Very aggressive jumps for instant feedback
      current += Math.floor(Math.random() * 35) + 12;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        // Instant fade out
        setTimeout(() => {
          setIsVisible(false);
          setLoading(false);
        }, 100);
      }
      setProgress(current);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {children}
      {loading && (
        <div className={`${styles.loaderContainer} ${!isVisible ? styles.fadeOut : ''}`}>
          <div className={styles.logoWrapper}>
        <Image src="/logo.webp" alt="Loading..." width={60} height={60} className={styles.loaderLogo} />
        <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className={styles.percentage}>{progress}%</div>
      </div>
      )}
    </>
  );
}
