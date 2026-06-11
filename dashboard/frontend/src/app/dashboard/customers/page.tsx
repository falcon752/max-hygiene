'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Customer } from '@/types';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import styles from './customers.module.css';

const emptyCustomer = (): Partial<Customer> => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: { line1: '', city: '', postcode: '' },
  notes: '',
});

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Customer>>(emptyCustomer());
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({ page, search: search || undefined });
      setCustomers(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(emptyCustomer()); setIsEdit(false); setFormOpen(true); };
  const openEdit = (c: Customer) => { setEditing({ ...c }); setIsEdit(true); setFormOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (isEdit && editing._id) {
        await api.updateCustomer(editing._id, editing);
        showToast('Customer updated');
      } else {
        await api.createCustomer(editing);
        showToast('Customer added');
      }
      setFormOpen(false);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const deleteCustomer = async () => {
    if (!deleteId) return;
    try {
      await api.deleteCustomer(deleteId);
      setDeleteId(null);
      load();
      showToast('Customer deleted');
    } catch { showToast('Delete failed'); }
  };

  const setAddr = (field: keyof Customer['address'], val: string) =>
    setEditing((c) => ({ ...c, address: { ...(c.address || { line1: '', city: '', postcode: '' }), [field]: val } }));

  return (
    <div>
      <Header
        title="Customers"
        subtitle={`${total} total customers`}
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="fas fa-user-plus" /> Add Customer
          </button>
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <i className="fas fa-search" />
          <input
            className="form-control"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" /></div>
      ) : customers.length === 0 ? (
        <div className="empty-state card">
          <i className="fas fa-users" />
          <p>No customers found</p>
        </div>
      ) : (
        <>
          <div className="table-wrap card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Bookings</th>
                  <th>Total Spent</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{c.email}</div>
                    </td>
                    <td>{c.phone}</td>
                    <td style={{ fontSize: '0.84rem' }}>{c.address?.city || '—'}</td>
                    <td><span className="badge badge-confirmed">{c.bookingCount}</span></td>
                    <td><strong>£{c.totalSpent.toFixed(2)}</strong></td>
                    <td style={{ fontSize: '0.83rem' }}>{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelected(c)} title="View"><i className="fas fa-eye" /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="Edit"><i className="fas fa-edit" /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(c._id)} style={{ color: 'var(--danger)' }}><i className="fas fa-trash" /></button>
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
              <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Page {page} of {pages}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= pages}>
                Next <i className="fas fa-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.firstName} ${selected.lastName}` : ''} size="md">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className={styles.detailGrid}>
              <div>
                <p className={styles.detailLabel}>Email</p>
                <p>{selected.email}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Phone</p>
                <p>{selected.phone}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Address</p>
                <p>{selected.address?.line1}</p>
                <p>{selected.address?.city} {selected.address?.postcode}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Stats</p>
                <p>{selected.bookingCount} booking(s)</p>
                <p>£{selected.totalSpent.toFixed(2)} total spent</p>
              </div>
            </div>
            {selected.notes && (
              <div>
                <p className={styles.detailLabel}>Notes</p>
                <p style={{ fontSize: '0.87rem' }}>{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={isEdit ? 'Edit Customer' : 'Add Customer'}
        size="md"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : null}
              {isEdit ? 'Save Changes' : 'Add Customer'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-control" value={editing.firstName || ''} onChange={(e) => setEditing((c) => ({ ...c, firstName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-control" value={editing.lastName || ''} onChange={(e) => setEditing((c) => ({ ...c, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" className="form-control" value={editing.email || ''} onChange={(e) => setEditing((c) => ({ ...c, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" value={editing.phone || ''} onChange={(e) => setEditing((c) => ({ ...c, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Address Line</label>
            <input className="form-control" value={editing.address?.line1 || ''} onChange={(e) => setAddr('line1', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-control" value={editing.address?.city || ''} onChange={(e) => setAddr('city', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Postcode</label>
              <input className="form-control" value={editing.address?.postcode || ''} onChange={(e) => setAddr('postcode', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={2} value={editing.notes || ''} onChange={(e) => setEditing((c) => ({ ...c, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Customer" size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={deleteCustomer}>Delete</button>
          </>
        }
      >
        <p>Delete this customer permanently? This cannot be undone.</p>
      </Modal>

      {toast && (
        <div className="toast-container">
          <div className="toast toast-success"><i className="fas fa-check-circle" />{toast}</div>
        </div>
      )}
    </div>
  );
}
