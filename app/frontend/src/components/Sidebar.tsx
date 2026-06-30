'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard',           icon: 'fas fa-chart-line',    label: 'Overview' },
  { href: '/dashboard/bookings',  icon: 'fas fa-calendar-check',label: 'Bookings' },
  { href: '/dashboard/quotes',    icon: 'fas fa-file-invoice',   label: 'Quotes' },
  { href: '/dashboard/services',  icon: 'fas fa-broom',         label: 'Services' },
  { href: '/dashboard/customers', icon: 'fas fa-users',          label: 'Customers' },
  { href: '/dashboard/schedule',  icon: 'fas fa-calendar-alt',  label: 'Schedule' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        {/* Mobile close button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
          <i className="fas fa-times" />
        </button>

        <div className={styles.logo}>
          <img src="/images/logo2.jpeg" alt="Max-Hygiene" style={{ height: '38px', width: 'auto', borderRadius: 6 }} />
          <span>Max-Hygiene</span>
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
                onClick={onClose}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navItem}
            onClick={onClose}
          >
            <i className="fas fa-external-link-alt" />
            <span>View Website</span>
          </a>
          <button className={`${styles.navItem} ${styles.logout}`} onClick={logout}>
            <i className="fas fa-sign-out-alt" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
