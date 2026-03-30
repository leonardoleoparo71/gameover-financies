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
    <button 
      onClick={scrollToTop}
      title="Voltar ao topo"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'var(--brand-primary)',
        color: '#fff',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        fontSize: '1.2rem',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => { 
        e.currentTarget.style.transform = 'translateY(-4px)'; 
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.6)'; 
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.transform = 'translateY(0)'; 
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)'; 
      }}
    >
      ⬆️
    </button>
  );
}
