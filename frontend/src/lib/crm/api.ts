import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  // Se o refresh falhou (token expirado sem atividade), desloga imediatamente
  if ((session as any)?.error === 'RefreshAccessTokenError') {
    signOut({ callbackUrl: '/login' });
    return Promise.reject(new Error('Sessão expirada'));
  }
  if ((session as any)?.accessToken) {
    config.headers.Authorization = `Bearer ${(session as any).accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Tenta obter sessão atualizada antes de deslogar
      const session = await getSession();
      if (!(session as any)?.accessToken || (session as any)?.error) {
        signOut({ callbackUrl: '/login' });
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const crm = {
  dashboard: () => api.get('/dashboard').then((r) => r.data),

  financial: {
    summary: (params?: { period?: string; start?: string; end?: string; serviceId?: string }) =>
      api.get('/financial/summary', { params }).then((r) => r.data),
    progression: (params?: { days?: number; start?: string; end?: string; serviceId?: string }) =>
      api.get('/financial/progression', { params }).then((r) => r.data),
    revenueByServiceByDay: (params?: { start?: string; end?: string }) =>
      api.get('/financial/revenue-by-service-by-day', { params }).then((r) => r.data),
    heatmap: (days = 90) =>
      api.get('/financial/heatmap', { params: { days } }).then((r) => r.data),
  },

  segments: () => api.get('/segments').then((r) => r.data),
  reactivation: {
    queue: (days = 30) => api.get(`/reactivation/queue?days=${days}`).then((r) => r.data),
    log: (data: { clientId: string; daysSince?: number; message: string }) =>
      api.post('/reactivation/log', data).then((r) => r.data),
    history: (limit = 50) => api.get(`/reactivation/history?limit=${limit}`).then((r) => r.data),
  },

  clients: {
    list: (search?: string) => api.get(`/clients${search ? `?search=${search}` : ''}`).then((r) => r.data),
    get: (id: string) => api.get(`/clients/${id}`).then((r) => r.data),
    create: (data: any) => api.post('/clients', data).then((r) => r.data),
    update: (id: string, data: any) => api.put(`/clients/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
  },

  vehicles: {
    list: (clientId?: string) => api.get(`/vehicles${clientId ? `?clientId=${clientId}` : ''}`).then((r) => r.data),
    create: (data: any) => api.post('/vehicles', data).then((r) => r.data),
    update: (id: string, data: any) => api.put(`/vehicles/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/vehicles/${id}`).then((r) => r.data),
  },

  services: {
    list: () => api.get('/services?activeOnly=true').then((r) => r.data),
    listAll: () => api.get('/services').then((r) => r.data),
    create: (data: { name: string; price: number; duration: number }) =>
      api.post('/services', data).then((r) => r.data),
    update: (id: string, data: Partial<{ name: string; price: number; duration: number; active: boolean }>) =>
      api.put(`/services/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/services/${id}`).then((r) => r.data),
  },

  orders: {
    list: (params?: { status?: string; date?: string; serviceId?: string }) =>
      api.get('/service-orders', { params }).then((r) => r.data),
    today: () => api.get('/service-orders/today').then((r) => r.data),
    create: (data: any) => api.post('/service-orders', data).then((r) => r.data),
    update: (id: string, data: any) => api.put(`/service-orders/${id}`, data).then((r) => r.data),
    pay: (id: string, payments: { method: string; amount: number }[]) =>
      api.put(`/service-orders/${id}`, { status: 'PAGO', payments }).then((r) => r.data),
  },

  cash: {
    today: () => api.get('/cash/today').then((r) => r.data),
    history: (days = 60) => api.get(`/cash/history?days=${days}`).then((r) => r.data),
    open: (data: { openingBalance: number; operatorName: string }) =>
      api.post('/cash/open', data).then((r) => r.data),
    close: (physicalCount: number) =>
      api.post('/cash/close', { physicalCount }).then((r) => r.data),
    reopen: () => api.post('/cash/reopen').then((r) => r.data),
    pendingClose: () => api.get('/cash/pending-close').then((r) => r.data),
    closeById: (id: string, physicalCount: number) =>
      api.post(`/cash/close/${id}`, { physicalCount }).then((r) => r.data),
    outflow: (data: { amount: number; reason: string }) =>
      api.post('/cash/outflow', data).then((r) => r.data),
  },

  settings: {
    get: (key: string) => api.get(`/settings/${key}`).then((r) => r.data),
    set: (key: string, value: string) => api.put(`/settings/${key}`, { value }).then((r) => r.data),
  },

  auth: {
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      api.patch('/auth/change-password', data).then((r) => r.data),
  },

  users: {
    list: () => api.get('/users').then((r) => r.data),
    create: (data: { email: string; name: string; password: string; role: string }) =>
      api.post('/users', data).then((r) => r.data),
    update: (id: string, data: { name?: string; role?: string; password?: string }) =>
      api.put(`/users/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/users/${id}`),
  },
};
