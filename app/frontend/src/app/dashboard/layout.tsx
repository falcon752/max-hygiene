'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import styles from './dashboard.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':           'Overview',
  '/dashboard/bookings':  'Bookings',
  '/dashboard/quotes':    'Quotes',
  '/dashboard/services':  'Services',
  '/dashboard/customers': 'Customers',
  '/dashboard/schedule':  'Schedule',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready,       setReady]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  // Close sidebar whenever route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard';

  return (
    <div className={styles.layout}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.burgerBtn}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <i className="fas fa-bars" />
        </button>
        <div className={styles.mobileTitle}>{pageTitle}</div>
        <div className={styles.mobileLogoWrap}>
          <img src="/images/logo2.jpeg" alt="Max-Hygiene" style={{ height: 32, width: 'auto', borderRadius: 4 }} />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
