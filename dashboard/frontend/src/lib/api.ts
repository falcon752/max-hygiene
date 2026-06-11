import { getToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ success: boolean; token: string; admin: { id: string; username: string; email: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) }
    ),
  me: () => request<{ success: boolean; admin: { id: string; username: string; email: string } }>('/auth/me'),

  // Services
  getServices: () => request<{ success: boolean; data: import('@/types').Service[] }>('/services/all'),
  getService: (id: string) => request<{ success: boolean; data: import('@/types').Service }>(`/services/${id}`),
  createService: (data: Partial<import('@/types').Service>) =>
    request<{ success: boolean; data: import('@/types').Service }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateService: (id: string, data: Partial<import('@/types').Service>) =>
    request<{ success: boolean; data: import('@/types').Service }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteService: (id: string) =>
    request<{ success: boolean }>(`/services/${id}`, { method: 'DELETE' }),

  // Bookings
  getBookings: (params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    return request<{
      success: boolean;
      data: import('@/types').Booking[];
      total: number;
      page: number;
      pages: number;
    }>(`/bookings?${q}`);
  },
  getBooking: (id: string) => request<{ success: boolean; data: import('@/types').Booking }>(`/bookings/${id}`),
  updateBooking: (id: string, data: Partial<import('@/types').Booking>) =>
    request<{ success: boolean; data: import('@/types').Booking }>(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBooking: (id: string) =>
    request<{ success: boolean }>(`/bookings/${id}`, { method: 'DELETE' }),
  getStats: () =>
    request<{ success: boolean; data: import('@/types').Stats }>('/bookings/stats'),

  // Customers
  getCustomers: (params?: { page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    return request<{
      success: boolean;
      data: import('@/types').Customer[];
      total: number;
      pages: number;
    }>(`/customers?${q}`);
  },
  getCustomer: (id: string) =>
    request<{ success: boolean; data: import('@/types').Customer; bookings: import('@/types').Booking[] }>(
      `/customers/${id}`
    ),
  createCustomer: (data: Partial<import('@/types').Customer>) =>
    request<{ success: boolean; data: import('@/types').Customer }>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomer: (id: string, data: Partial<import('@/types').Customer>) =>
    request<{ success: boolean; data: import('@/types').Customer }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCustomer: (id: string) =>
    request<{ success: boolean }>(`/customers/${id}`, { method: 'DELETE' }),

  // Availability
  getAvailability: () =>
    request<{ success: boolean; data: import('@/types').Availability[] }>('/availability/all'),
  setAvailability: (data: { date: string; available: boolean; slots: string[] }) =>
    request<{ success: boolean; data: import('@/types').Availability }>('/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAvailability: (date: string, data: Partial<import('@/types').Availability>) =>
    request<{ success: boolean; data: import('@/types').Availability }>(`/availability/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAvailability: (date: string) =>
    request<{ success: boolean }>(`/availability/${date}`, { method: 'DELETE' }),
};
