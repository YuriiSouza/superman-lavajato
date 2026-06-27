import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if ((session as any)?.accessToken) {
    config.headers.Authorization = `Bearer ${(session as any).accessToken}`;
  }
  return config;
});

export default api;

export const crm = {
  dashboard: () => api.get('/dashboard').then((r) => r.data),
  financial: (period = 'day') => api.get(`/financial/summary?period=${period}`).then((r) => r.data),
  segments: () => api.get('/segments').then((r) => r.data),
  reactivation: (days = 30) => api.get(`/reactivation/queue?days=${days}`).then((r) => r.data),

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
  },

  orders: {
    list: (params?: { status?: string; date?: string }) =>
      api.get('/service-orders', { params }).then((r) => r.data),
    today: () => api.get('/service-orders/today').then((r) => r.data),
    create: (data: any) => api.post('/service-orders', data).then((r) => r.data),
    update: (id: string, data: any) => api.put(`/service-orders/${id}`, data).then((r) => r.data),
  },
};
