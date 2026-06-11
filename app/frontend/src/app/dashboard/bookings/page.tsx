'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Booking } from '@/types';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import styles from './bookings.module.css';

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  cancelled: 'badge-cancelled',
  completed: 'badge-completed',
};

const FREQ_LABELS: Record<string, string> = {
  once: 'One-Time',
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  monthly: 'Monthly',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getBookings({ page, status: statusFilter || undefined, search: search || undefined });
      setBookings(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateBooking(id, { status } as Partial<Booking>);
      if (selected?._id === id) setSelected((s) => s ? { ...s, status: status as Booking['status'] } : s);
      setBookings((bs) => bs.map((b) => b._id === id ? { ...b, status: status as Booking['status'] } : b));
      showToast('Status updated');
    } catch {
      showToast('Failed to update status');
    }
  };

  const deleteBooking = async () => {
    if (!deleteId) return;
    try {
      await api.deleteBooking(deleteId);
      setDeleteId(null);
      load();
      showToast('Booking deleted');
    } catch {
      showToast('Delete failed');
    }
  };

  return (
    <div>
      <Header title="Bookings" subtitle={`${total} total bookings`} />

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <i className="fas fa-search" />
          <input
            className="form-control"
            placeholder="Search by name, email or ref…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}><span className="spinner" /></div>
      ) : bookings.length === 0 ? (
        <div className="empty-state card">
          <i className="fas fa-calendar-times" />
          <p>No bookings found</p>
        </div>
      ) : (
        <>
          <div className="table-wrap card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td><span className={styles.ref}>{b.ref}</span></td>
                    <td>
                      <div>{b.customer.firstName} {b.customer.lastName}</div>
                      <div className={styles.sub}>{b.customer.email}</div>
                    </td>
                    <td>{b.service.name}</td>
                    <td>
                      <div>{new Date(b.date).toLocaleDateString('en-GB')}</div>
                      <div className={styles.sub}>{b.timeSlot}</div>
                    </td>
                    <td><strong>£{b.totalPrice.toFixed(2)}</strong></td>
                    <td>
                      <select
                        className={`badge ${STATUS_COLORS[b.status]} ${styles.statusSelect}`}
                        value={b.status}
                        onChange={(e) => updateStatus(b._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelected(b)} title="View">
                          <i className="fas fa-eye" />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(b._id)} title="Delete" style={{ color: 'var(--danger)' }}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className={styles.pagination}>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                <i className="fas fa-chevron-left" /> Prev
              </button>
              <span className={styles.pageInfo}>Page {page} of {pages}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= pages}>
                Next <i className="fas fa-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Booking Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Booking ${selected?.ref}`} size="lg">
        {selected && (
          <div className={styles.detail}>
            <div className={styles.detailGrid}>
              <div className={styles.detailSection}>
                <h3>Customer</h3>
                <p><strong>Name:</strong> {selected.customer.firstName} {selected.customer.lastName}</p>
                <p><strong>Email:</strong> {selected.customer.email}</p>
                <p><strong>Phone:</strong> {selected.customer.phone}</p>
              </div>
              <div className={styles.detailSection}>
                <h3>Address</h3>
                <p>{selected.address.line1}</p>
                <p>{selected.address.city}</p>
                <p>{selected.address.postcode}</p>
              </div>
              <div className={styles.detailSection}>
                <h3>Service</h3>
                <p><strong>Service:</strong> {selected.service.name}</p>
                <p><strong>Pricing:</strong> {selected.pricingType === 'hourly' ? `Hourly — ${selected.hours}hrs` : 'Flat Rate'}</p>
                <p><strong>Property:</strong> {selected.propertyType}</p>
                <p><strong>Frequency:</strong> {FREQ_LABELS[selected.frequency] || selected.frequency}</p>
              </div>
              <div className={styles.detailSection}>
                <h3>Schedule</h3>
                <p><strong>Date:</strong> {new Date(selected.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Time:</strong> {selected.timeSlot}</p>
              </div>
            </div>

            {selected.rooms.length > 0 && (
              <div className={styles.detailSection}>
                <h3>Rooms / Tasks</h3>
                <div className={styles.roomsList}>
                  {selected.rooms.map((r, i) => (
                    <div key={i} className={styles.roomItem}>
                      <span>{r.name} x{r.qty}</span>
                      <span>£{(r.price * r.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.extras.length > 0 && (
              <div className={styles.detailSection}>
                <h3>Extra Services</h3>
                <div className={styles.roomsList}>
                  {selected.extras.map((e, i) => (
                    <div key={i} className={styles.roomItem}>
                      <span>{e.name}</span>
                      <span>£{e.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.notes && (
              <div className={styles.detailSection}>
                <h3>Notes</h3>
                <p>{selected.notes}</p>
              </div>
            )}

            <div className={styles.priceBreakdown}>
              {selected.discount > 0 && (
                <div className={styles.priceRow}>
                  <span>Discount</span>
                  <span style={{ color: 'var(--secondary)' }}>-£{selected.discount.toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.priceRow} ${styles.total}`}>
                <span>Total</span>
                <span>£{selected.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Booking" size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={deleteBooking}>Delete</button>
          </>
        }
      >
        <p>Are you sure you want to permanently delete this booking? This cannot be undone.</p>
      </Modal>

      {toast && (
        <div className="toast-container">
          <div className="toast toast-success"><i className="fas fa-check-circle" />{toast}</div>
        </div>
      )}
    </div>
  );
}
