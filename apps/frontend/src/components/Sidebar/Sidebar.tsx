'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <img src="/logo.webp" alt="GameOver" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
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
        <button onClick={logout} className={styles.logoutBtn} title="Sair">⬅️</button>
      </div>
    </aside>
  );
}
