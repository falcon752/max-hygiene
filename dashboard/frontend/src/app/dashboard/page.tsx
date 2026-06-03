'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Stats, Booking } from '@/types';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import styles from './overview.module.css';

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  cancelled: 'badge-cancelled',
  completed: 'badge-completed',
};

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getBookings({ limit: 8 })])
      .then(([s, b]) => {
        setStats(s.data);
        setRecentBookings(b.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const monthTrend = stats
    ? stats.lastMonth > 0
      ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100
      : 0
    : 0;

  return (
    <div>
      <Header
        title="Overview"
        subtitle={`Welcome back! Here's what's happening today.`}
      />

      <div className={styles.statsGrid}>
        <StatsCard
          title="Total Bookings"
          value={stats?.total ?? 0}
          icon="fas fa-calendar-check"
          color="primary"
          trend={{ value: Math.round(monthTrend), label: 'vs last month' }}
        />
        <StatsCard
          title="This Month"
          value={stats?.thisMonth ?? 0}
          icon="fas fa-calendar"
          color="secondary"
        />
        <StatsCard
          title="Pending"
          value={stats?.pending ?? 0}
          icon="fas fa-clock"
          color="warning"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`£${(stats?.monthlyRevenue ?? 0).toFixed(0)}`}
          icon="fas fa-pound-sign"
          color="secondary"
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Bookings</h2>
          <a href="/dashboard/bookings" className="btn btn-outline btn-sm">
            View All <i className="fas fa-arrow-right" />
          </a>
        </div>

        {recentBookings.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-times" />
            <p>No bookings yet</p>
          </div>
        ) : (
          <div className="table-wrap card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b._id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{b.ref}</span></td>
                    <td>{b.customer.firstName} {b.customer.lastName}</td>
                    <td>{b.service.name}</td>
                    <td>{new Date(b.date).toLocaleDateString('en-GB')}</td>
                    <td><strong>£{b.totalPrice.toFixed(2)}</strong></td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[b.status]}`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
