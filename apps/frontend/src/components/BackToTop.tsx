'use client';

import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        .back-to-top-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--brand-primary);
          color: #fff;
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          font-size: 1.2rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .back-to-top-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.6);
        }
      `}</style>
      <button 
        className="back-to-top-btn"
        onClick={scrollToTop}
        title="Voltar ao topo"
      >
        ⬆️
      </button>
    </>
  );
}
