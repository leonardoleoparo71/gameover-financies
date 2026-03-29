'use client';

import React, { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

export default function LoadingScreen({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinished, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [onFinished]);

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <div className={styles.circle}>
          <img src="/logo.webp" alt="Loading..." className={styles.logo} />
        </div>
        <div className={styles.progressText}>{progress}%</div>
      </div>
    </div>
  );
}
