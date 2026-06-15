'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Availability } from '@/types';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import styles from './schedule.module.css';

const ALL_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SchedulePage() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editSlots, setEditSlots] = useState<string[]>([...ALL_SLOTS]);
  const [editAvail, setEditAvail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAvailability();
      setAvailability(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const avMap = Object.fromEntries(availability.map((a) => [a.date, a]));

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const openDay = (date: string) => {
    const existing = avMap[date];
    setSelected(date);
    setEditAvail(existing ? existing.available : true);
    setEditSlots(existing ? [...existing.slots] : [...ALL_SLOTS]);
    setEditModal(true);
  };

  const saveDay = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.setAvailability({ date: selected, available: editAvail, slots: editSlots });
      showToast('Availability saved');
      setEditModal(false);
      load();
    } catch {
      showToast('Save failed');
    } finally { setSaving(false); }
  };

  const removeDay = async (date: string) => {
    try {
      await api.deleteAvailability(date);
      load();
      showToast('Entry removed');
    } catch { showToast('Remove failed'); }
  };

  const toggleSlot = (slot: string) => {
    setEditSlots((s) => s.includes(slot) ? s.filter((x) => x !== slot) : [...s, slot].sort());
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date().toISOString().slice(0, 10);

  const cells: (string | null)[] = [...Array(firstDay).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  return (
    <div>
      <Header
        title="Schedule"
        subtitle="Manage available dates and time slots for bookings"
      />

      <div className="card" style={{ marginBottom: 24 }}>
        <div className={styles.calHeader}>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
            else setViewMonth((m) => m - 1);
          }}>
            <i className="fas fa-chevron-left" />
          </button>
          <h2 className={styles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
            else setViewMonth((m) => m + 1);
          }}>
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        <div className={styles.calGrid}>
          {DAYS.map((d) => <div key={d} className={styles.dayHeader}>{d}</div>)}
          {cells.map((date, i) => {
            if (!date) return <div key={i} className={styles.emptyCell} />;
            const entry = avMap[date];
            const isToday = date === today;
            const isPast = date < today;
            return (
              <button
                key={date}
                className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isPast ? styles.past : ''} ${entry?.available === false ? styles.unavailable : ''} ${entry && entry.available ? styles.hasSlots : ''}`}
                onClick={() => !isPast && openDay(date)}
                disabled={isPast}
                title={entry ? `${entry.available ? entry.slots.length + ' slots' : 'Unavailable'}` : 'Click to configure'}
              >
                <span className={styles.dayNum}>{new Date(date).getDate()}</span>
                {entry && (
                  <span className={styles.dayMeta}>
                    {entry.available ? `${entry.slots.length} slots` : 'Blocked'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotAvail}`} /> Available</div>
          <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotUnavail}`} /> Blocked</div>
          <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotNone}`} /> Not configured (default available)</div>
        </div>
      </div>

      {/* Availability List */}
      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>Configured Dates</h3>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" /></div>
        ) : availability.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar" />
            <p>No dates configured yet. Click a date on the calendar to set availability.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Available Slots</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {availability.map((a) => (
                  <tr key={a._id}>
                    <td>{new Date(a.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>
                      <span className={`badge ${a.available ? 'badge-confirmed' : 'badge-cancelled'}`}>
                        {a.available ? 'Available' : 'Blocked'}
                      </span>
                    </td>
                    <td>
                      {a.available ? (
                        <div className={styles.slotList}>
                          {a.slots.map((s) => <span key={s} className={styles.slotChip}>{s}</span>)}
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openDay(a.date)}><i className="fas fa-edit" /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeDay(a.date)} style={{ color: 'var(--danger)' }}><i className="fas fa-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={selected ? `Configure ${new Date(selected + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}
        size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveDay} disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <i className="fas fa-save" />}
              Save
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <label className="toggle">
            <input type="checkbox" checked={editAvail} onChange={(e) => setEditAvail(e.target.checked)} />
            <span className="toggle-slider" />
            <span className="form-label" style={{ margin: 0 }}>This date is available for bookings</span>
          </label>

          {editAvail && (
            <div>
              <p className="form-label" style={{ marginBottom: 10 }}>Available Time Slots</p>
              <div className={styles.slotsGrid}>
                {ALL_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`${styles.slotBtn} ${editSlots.includes(slot) ? styles.slotActive : ''}`}
                    onClick={() => toggleSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 8 }}>
                {editSlots.length} slot(s) selected
              </p>
            </div>
          )}
        </div>
      </Modal>

      {toast && (
        <div className="toast-container">
          <div className="toast toast-success"><i className="fas fa-check-circle" />{toast}</div>
        </div>
      )}
    </div>
  );
}
