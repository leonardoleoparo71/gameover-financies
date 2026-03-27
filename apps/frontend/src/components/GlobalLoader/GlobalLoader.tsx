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
      <div className={styles.hammerWrapper}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className={styles.hammerOutline}
        >
          {/* Base Thor Hammer SVG Path */}
          <path d="M4 12V8h16v4M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2M12 12v10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={styles.hammerFill}
          style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
        >
          {/* Base Thor Hammer SVG Path filled */}
          <path d="M4 12V8h16v4M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2M12 12v10M11 12v10h2V12h-2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className={styles.percentage}>{progress}%</div>
    </div>
  );
}
