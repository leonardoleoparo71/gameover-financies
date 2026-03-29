'use client';

import { useEffect, useState } from 'react';
import styles from './GlobalLoader.module.css';

export default function GlobalLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      // Faster steps and shorter interval
      current += Math.floor(Math.random() * 25) + 8;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        // Start fading out
        setTimeout(() => {
          setIsVisible(false);
          setLoading(false);
        }, 150);
      }
      setProgress(current);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {children}
      {loading && (
        <div className={`${styles.loaderContainer} ${!isVisible ? styles.fadeOut : ''}`}>
          <div className={styles.logoWrapper}>
        <img src="/logo.webp" alt="Loading..." className={styles.loaderLogo} />
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
