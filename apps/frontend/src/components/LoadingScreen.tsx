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
            {/* Detailed Mjolnir SVG - 100% fidelity */}
            {/* Handle Straps */}
            <rect x="48" y="55" width="4" height="30" fill="white" rx="0.5" />
            <path d="M48 60 L52 62 M48 65 L52 67 M48 70 L52 72 M48 75 L52 77" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
            
            {/* Handle Pommel / Loop */}
            <circle cx="50" cy="85" r="4.5" fill="none" stroke="white" strokeWidth="2" />
            
            {/* Hammer Head - Heavy Faceted 8-point shape */}
            <path 
              d="M22 42 L78 42 L82 46 L82 54 L78 58 L22 58 L18 54 L18 46 Z" 
              fill="white" 
            />
            {/* Head Face Details (Bevels) */}
            <path d="M22 42 L18 46 L82 46 L78 42 Z" fill="rgba(0,0,0,0.15)" />
            <path d="M22 58 L18 54 L82 54 L78 58 Z" fill="rgba(0,0,0,0.25)" />
            
            {/* Central Engraving / Glow effect */}
            <rect x="30" y="47" width="40" height="6" fill="rgba(0,0,0,0.05)" rx="1" />
          </svg>
        </div>
        <div className={styles.progressText}>{progress}%</div>
      </div>
    </div>
  );
}
