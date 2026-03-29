import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/expenses', label: 'Despesas', icon: '💸' },
  { href: '/purchases', label: 'Compras Futuras', icon: '🛒' },
  { href: '/goals', label: 'Metas', icon: '🎯' },
  { href: '/planning', label: 'Planejamento', icon: '🌳' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logo}>
          <Image src="/logo.webp" alt="GameOver" width={32} height={32} style={{ objectFit: 'contain' }} />
          <span className={styles.logoText}>GameOver</span>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className={styles.logoutBtn} title="Sair">⬅️</button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop" style={{ zIndex: 2000 }}>
          <div className="modal" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
            <h2 className="modal-title" style={{ marginBottom: '1rem' }}>Já vai?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Tem certeza que deseja encerrar sua sessão no GameOver?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1 }}
              >
                Continuar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={logout}
                style={{ flex: 1 }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
