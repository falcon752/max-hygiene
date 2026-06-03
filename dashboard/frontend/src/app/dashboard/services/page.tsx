'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Service, Room, Extra } from '@/types';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import styles from './services.module.css';

const DEFAULT_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

const emptyService = (): Partial<Service> => ({
  name: '',
  description: '',
  icon: 'fas fa-broom',
  pricingType: 'flat',
  hourlyRate: 0,
  flatRateMode: 'rooms',
  rooms: [],
  extras: [],
  active: true,
});

const emptyRoom = (): Room => ({ id: '', name: '', price: 0, icon: 'fas fa-home', forms: [] });
const emptyExtra = (): Extra => ({ id: '', name: '', price: 0, icon: 'fas fa-plus' });

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Service>>(emptyService());
  const [isEdit, setIsEdit] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [roomModal, setRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room>(emptyRoom());
  const [roomEditIdx, setRoomEditIdx] = useState<number | null>(null);
  const [extraModal, setExtraModal] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra>(emptyExtra());
  const [extraEditIdx, setExtraEditIdx] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getServices();
      setServices(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(emptyService());
    setIsEdit(false);
    setFormOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing({ ...s });
    setIsEdit(true);
    setFormOpen(true);
  };

  const save = async () => {
    if (!editing.name) return;
    setSaving(true);
    try {
      if (isEdit && editing._id) {
        await api.updateService(editing._id, editing);
        showToast('Service updated');
      } else {
        await api.createService(editing);
        showToast('Service created');
      }
      setFormOpen(false);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async () => {
    if (!deleteId) return;
    try {
      await api.deleteService(deleteId);
      setDeleteId(null);
      load();
      showToast('Service deleted');
    } catch {
      showToast('Delete failed');
    }
  };

  const saveRoom = () => {
    const room: Room = {
      ...editingRoom,
      id: editingRoom.id || Math.random().toString(36).slice(2),
    };
    const rooms = [...(editing.rooms || [])];
    if (roomEditIdx !== null) {
      rooms[roomEditIdx] = room;
    } else {
      rooms.push(room);
    }
    setEditing((e) => ({ ...e, rooms }));
    setRoomModal(false);
    setEditingRoom(emptyRoom());
    setRoomEditIdx(null);
  };

  const removeRoom = (idx: number) => {
    setEditing((e) => ({ ...e, rooms: (e.rooms || []).filter((_, i) => i !== idx) }));
  };

  const saveExtra = () => {
    const extra: Extra = {
      ...editingExtra,
      id: editingExtra.id || Math.random().toString(36).slice(2),
    };
    const extras = [...(editing.extras || [])];
    if (extraEditIdx !== null) {
      extras[extraEditIdx] = extra;
    } else {
      extras.push(extra);
    }
    setEditing((e) => ({ ...e, extras }));
    setExtraModal(false);
    setEditingExtra(emptyExtra());
    setExtraEditIdx(null);
  };

  const removeExtra = (idx: number) => {
    setEditing((e) => ({ ...e, extras: (e.extras || []).filter((_, i) => i !== idx) }));
  };

  return (
    <div>
      <Header
        title="Services"
        subtitle="Manage your cleaning services, pricing, and rooms"
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="fas fa-plus" /> Add Service
          </button>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" /></div>
      ) : (
        <div className={styles.grid}>
          {services.length === 0 && (
            <div className="empty-state card" style={{ gridColumn: '1/-1' }}>
              <i className="fas fa-broom" />
              <p>No services yet. Add your first service.</p>
            </div>
          )}
          {services.map((s) => (
            <div key={s._id} className={styles.serviceCard}>
              <div className={styles.cardTop}>
                <div className={styles.cardIcon}><i className={s.icon} /></div>
                <div className={styles.cardInfo}>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                </div>
                <div className={styles.cardMeta}>
                  <span className={`badge ${s.active ? 'badge-confirmed' : 'badge-cancelled'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className={styles.cardTags}>
                <span className={styles.tag}>
                  <i className="fas fa-tag" />
                  {s.pricingType === 'hourly' ? `£${s.hourlyRate}/hr` : 'Flat Rate'}
                </span>
                <span className={styles.tag}>
                  <i className="fas fa-door-open" /> {s.rooms.length} rooms
                </span>
                <span className={styles.tag}>
                  <i className="fas fa-plus-circle" /> {s.extras.length} extras
                </span>
              </div>
              <div className={styles.cardActions}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>
                  <i className="fas fa-edit" /> Edit
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(s._id)} style={{ color: 'var(--danger)' }}>
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={isEdit ? 'Edit Service' : 'Add Service'}
        size="xl"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <i className="fas fa-save" />}
              {isEdit ? 'Save Changes' : 'Create Service'}
            </button>
          </>
        }
      >
        <div className={styles.formGrid}>
          {/* Basic Info */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Basic Information</h4>
            <div className={styles.formRow}>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Service Name *</label>
                <input className="form-control" value={editing.name || ''} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Residential Deep Clean" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Icon Class</label>
                <input className="form-control" value={editing.icon || ''} onChange={(e) => setEditing((s) => ({ ...s, icon: e.target.value }))} placeholder="fas fa-broom" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={editing.description || ''} onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))} placeholder="Short description of this service" />
            </div>
            <div className={styles.formRow}>
              <div className="form-group">
                <label className="form-label">Pricing Type</label>
                <select className="form-control" value={editing.pricingType} onChange={(e) => setEditing((s) => ({ ...s, pricingType: e.target.value as 'flat' | 'hourly' }))}>
                  <option value="flat">Flat Rate</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>
              {editing.pricingType === 'hourly' ? (
                <div className="form-group">
                  <label className="form-label">Hourly Rate (£)</label>
                  <input type="number" className="form-control" value={editing.hourlyRate || 0} onChange={(e) => setEditing((s) => ({ ...s, hourlyRate: parseFloat(e.target.value) }))} min={0} step={0.5} />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Flat Rate Mode</label>
                  <select className="form-control" value={editing.flatRateMode} onChange={(e) => setEditing((s) => ({ ...s, flatRateMode: e.target.value as 'quote' | 'rooms' }))}>
                    <option value="rooms">Rooms &amp; Tasks</option>
                    <option value="quote">Get a Quote</option>
                  </select>
                </div>
              )}
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label className="toggle" style={{ marginTop: 28 }}>
                  <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing((s) => ({ ...s, active: e.target.checked }))} />
                  <span className="toggle-slider" />
                  <span className="form-label" style={{ margin: 0 }}>Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Rooms (only for flat+rooms mode) */}
          {editing.pricingType === 'flat' && editing.flatRateMode === 'rooms' && (
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.formSectionTitle}>Rooms / Tasks</h4>
                <button className="btn btn-outline btn-sm" type="button" onClick={() => { setEditingRoom(emptyRoom()); setRoomEditIdx(null); setRoomModal(true); }}>
                  <i className="fas fa-plus" /> Add Room
                </button>
              </div>
              {(editing.rooms || []).length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>No rooms yet. Add rooms/tasks for this service.</p>
              )}
              <div className={styles.itemList}>
                {(editing.rooms || []).map((r, i) => (
                  <div key={i} className={styles.itemRow}>
                    <i className={r.icon} style={{ color: 'var(--primary)', width: 20 }} />
                    <span style={{ flex: 1 }}>{r.name}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>£{r.price}</span>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setEditingRoom(r); setRoomEditIdx(i); setRoomModal(true); }}><i className="fas fa-edit" /></button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => removeRoom(i)} style={{ color: 'var(--danger)' }}><i className="fas fa-times" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extras */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.formSectionTitle}>Extra Services</h4>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => { setEditingExtra(emptyExtra()); setExtraEditIdx(null); setExtraModal(true); }}>
                <i className="fas fa-plus" /> Add Extra
              </button>
            </div>
            {(editing.extras || []).length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>No extras yet.</p>
            )}
            <div className={styles.itemList}>
              {(editing.extras || []).map((e, i) => (
                <div key={i} className={styles.itemRow}>
                  <i className={e.icon} style={{ color: 'var(--primary)', width: 20 }} />
                  <span style={{ flex: 1 }}>{e.name}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>£{e.price}</span>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setEditingExtra(e); setExtraEditIdx(i); setExtraModal(true); }}><i className="fas fa-edit" /></button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => removeExtra(i)} style={{ color: 'var(--danger)' }}><i className="fas fa-times" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Room Form Modal */}
      <Modal open={roomModal} onClose={() => setRoomModal(false)} title={roomEditIdx !== null ? 'Edit Room' : 'Add Room'} size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setRoomModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveRoom}>Save</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Room / Task Name *</label>
            <input className="form-control" value={editingRoom.name} onChange={(e) => setEditingRoom((r) => ({ ...r, name: e.target.value }))} placeholder="e.g. Bathroom" />
          </div>
          <div className="form-group">
            <label className="form-label">Price (£)</label>
            <input type="number" className="form-control" value={editingRoom.price} onChange={(e) => setEditingRoom((r) => ({ ...r, price: parseFloat(e.target.value) || 0 }))} min={0} step={1} />
          </div>
          <div className="form-group">
            <label className="form-label">Icon Class</label>
            <input className="form-control" value={editingRoom.icon} onChange={(e) => setEditingRoom((r) => ({ ...r, icon: e.target.value }))} placeholder="fas fa-bath" />
          </div>
        </div>
      </Modal>

      {/* Extra Form Modal */}
      <Modal open={extraModal} onClose={() => setExtraModal(false)} title={extraEditIdx !== null ? 'Edit Extra' : 'Add Extra'} size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setExtraModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveExtra}>Save</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Extra Service Name *</label>
            <input className="form-control" value={editingExtra.name} onChange={(e) => setEditingExtra((x) => ({ ...x, name: e.target.value }))} placeholder="e.g. Cleaning Products" />
          </div>
          <div className="form-group">
            <label className="form-label">Price (£)</label>
            <input type="number" className="form-control" value={editingExtra.price} onChange={(e) => setEditingExtra((x) => ({ ...x, price: parseFloat(e.target.value) || 0 }))} min={0} step={1} />
          </div>
          <div className="form-group">
            <label className="form-label">Icon Class</label>
            <input className="form-control" value={editingExtra.icon} onChange={(e) => setEditingExtra((x) => ({ ...x, icon: e.target.value }))} placeholder="fas fa-flask" />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Service" size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={deleteService}>Delete</button>
          </>
        }
      >
        <p>Are you sure you want to delete this service? This cannot be undone.</p>
      </Modal>

      {toast && (
        <div className="toast-container">
          <div className="toast toast-success"><i className="fas fa-check-circle" />{toast}</div>
        </div>
      )}
    </div>
  );
}
