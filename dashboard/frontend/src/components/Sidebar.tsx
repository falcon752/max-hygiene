'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', icon: 'fas fa-chart-line', label: 'Overview' },
  { href: '/dashboard/bookings', icon: 'fas fa-calendar-check', label: 'Bookings' },
  { href: '/dashboard/services', icon: 'fas fa-broom', label: 'Services' },
  { href: '/dashboard/customers', icon: 'fas fa-users', label: 'Customers' },
  { href: '/dashboard/schedule', icon: 'fas fa-calendar-alt', label: 'Schedule' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/images/logo2.jpeg" alt="Max-Hygiene Logo" style={{ height: '40px', width: 'auto' }} />
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <a href="/" target="_blank" rel="noopener noreferrer" className={styles.navItem}>
          <i className="fas fa-external-link-alt" />
          <span>View Website</span>
        </a>
        <button className={`${styles.navItem} ${styles.logout}`} onClick={logout}>
          <i className="fas fa-sign-out-alt" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
