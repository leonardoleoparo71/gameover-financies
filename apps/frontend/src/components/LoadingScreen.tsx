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
          <svg viewBox="0 0 100 100" className={styles.mjolnir}>
            {/* Handle */}
            <rect x="48" y="60" width="4" height="25" fill="white" rx="1" />
            <circle cx="50" cy="85" r="4" fill="none" stroke="white" strokeWidth="2" />
            {/* Hammer Head - Faceted */}
            <path 
              d="M25 40 L75 40 L80 45 L80 55 L75 60 L25 60 L20 55 L20 45 Z" 
              fill="white" 
            />
            {/* Top part of head */}
            <path d="M25 40 L20 45 L80 45 L75 40 Z" fill="rgba(0,0,0,0.1)" />
            {/* Bottom part of head */}
            <path d="M25 60 L20 55 L80 55 L75 60 Z" fill="rgba(0,0,0,0.2)" />
          </svg>
        </div>
        <div className={styles.progressText}>{progress}%</div>
      </div>
    </div>
  );
}
