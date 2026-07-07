import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  // Se o refresh falhou (token expirado sem atividade), desloga imediatamente
  if ((session as any)?.error === "RefreshAccessTokenError") {
    signOut({ callbackUrl: "/login" });
    return Promise.reject(new Error("Sessão expirada"));
  }
  if ((session as any)?.accessToken) {
    config.headers.Authorization = `Bearer ${(session as any).accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Tenta obter sessão atualizada antes de deslogar
      const session = await getSession();
      if (!(session as any)?.accessToken || (session as any)?.error) {
        signOut({ callbackUrl: "/login" });
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const crm = {
  dashboard: () => api.get("/dashboard").then((r) => r.data),

  financial: {
    summary: (params?: {
      period?: string;
      start?: string;
      end?: string;
      serviceId?: string;
    }) => api.get("/financial/summary", { params }).then((r) => r.data),
    progression: (params?: {
      days?: number;
      start?: string;
      end?: string;
      serviceId?: string;
    }) => api.get("/financial/progression", { params }).then((r) => r.data),
    revenueByServiceByDay: (params?: { start?: string; end?: string }) =>
      api
        .get("/financial/revenue-by-service-by-day", { params })
        .then((r) => r.data),
    heatmap: (days = 90) =>
      api.get("/financial/heatmap", { params: { days } }).then((r) => r.data),
    byVehicleType: (days = 90) =>
      api
        .get("/financial/by-vehicle-type", { params: { days } })
        .then((r) => r.data),
    profit: (params?: { period?: string; start?: string; end?: string }) =>
      api.get("/financial/profit", { params }).then((r) => r.data),
    dre: (months = 6) =>
      api.get("/financial/dre", { params: { months } }).then((r) => r.data),
    reserves: {
      list: () => api.get("/financial/reserves").then((r) => r.data),
      summary: () => api.get("/financial/reserves/summary").then((r) => r.data),
      create: (data: {
        billId: string;
        amount: number;
        description?: string;
      }) => api.post("/financial/reserves", data).then((r) => r.data),
      remove: (id: string) =>
        api.delete(`/financial/reserves/${id}`).then((r) => r.data),
    },
  },

  segments: () => api.get("/segments").then((r) => r.data),
  reactivation: {
    queue: (days = 30) =>
      api.get(`/reactivation/queue?days=${days}`).then((r) => r.data),
    log: (data: { clientId: string; daysSince?: number; message: string }) =>
      api.post("/reactivation/log", data).then((r) => r.data),
    history: (limit = 50) =>
      api.get(`/reactivation/history?limit=${limit}`).then((r) => r.data),
  },

  clients: {
    list: (search?: string, limit = 50, offset = 0) =>
      api
        .get("/clients", {
          params: { ...(search ? { search } : {}), limit, offset },
        })
        .then((r) => r.data),
    get: (id: string) => api.get(`/clients/${id}`).then((r) => r.data),
    create: (data: any) => api.post("/clients", data).then((r) => r.data),
    update: (id: string, data: any) =>
      api.put(`/clients/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
  },

  vehicles: {
    list: (clientId?: string) =>
      api
        .get(`/vehicles${clientId ? `?clientId=${clientId}` : ""}`)
        .then((r) => r.data),
    create: (data: any) => api.post("/vehicles", data).then((r) => r.data),
    update: (id: string, data: any) =>
      api.put(`/vehicles/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/vehicles/${id}`).then((r) => r.data),
  },

  services: {
    list: () => api.get("/services?activeOnly=true").then((r) => r.data),
    listAll: () => api.get("/services").then((r) => r.data),
    create: (data: {
      name: string;
      description?: string;
      price: number;
      duration: number;
      features?: string[];
      highlight?: boolean;
      categoryId?: string;
    }) => api.post("/services", data).then((r) => r.data),
    update: (
      id: string,
      data: Partial<{
        name: string;
        description: string;
        price: number;
        duration: number;
        features: string[];
        highlight: boolean;
        active: boolean;
        categoryId: string | null;
      }>,
    ) => api.put(`/services/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/services/${id}`).then((r) => r.data),
    categories: {
      list: () => api.get("/services/categories").then((r) => r.data),
      create: (data: { name: string; requiresVehicle?: boolean }) =>
        api.post("/services/categories", data).then((r) => r.data),
      update: (
        id: string,
        data: { name?: string; requiresVehicle?: boolean; active?: boolean },
      ) => api.put(`/services/categories/${id}`, data).then((r) => r.data),
      remove: (id: string) =>
        api.delete(`/services/categories/${id}`).then((r) => r.data),
    },
  },

  orders: {
    list: (params?: { status?: string; date?: string; serviceId?: string }) =>
      api.get("/service-orders", { params }).then((r) => r.data),
    today: () => api.get("/service-orders/today").then((r) => r.data),
    create: (data: {
      serviceId: string;
      clientId?: string;
      vehicleId?: string;
      customerDescription?: string;
      scheduledAt?: string;
      totalValue: number;
      notes?: string;
    }) => api.post("/service-orders", data).then((r) => r.data),
    update: (id: string, data: any) =>
      api.put(`/service-orders/${id}`, data).then((r) => r.data),
    pay: (id: string, payments: { method: string; amount: number }[]) =>
      api
        .put(`/service-orders/${id}`, { status: "PAGO", payments })
        .then((r) => r.data),
  },

  cash: {
    today: () => api.get("/cash/today").then((r) => r.data),
    history: (days = 60) =>
      api.get(`/cash/history?days=${days}`).then((r) => r.data),
    suggestedOpening: () =>
      api.get("/cash/suggested-opening").then((r) => r.data),
    open: (data: {
      openingBalance: number;
      digitalOpeningBalance?: number;
      operatorName: string;
    }) => api.post("/cash/open", data).then((r) => r.data),
    close: (physicalCount: number) =>
      api.post("/cash/close", { physicalCount }).then((r) => r.data),
    reopen: () => api.post("/cash/reopen").then((r) => r.data),
    pendingClose: () => api.get("/cash/pending-close").then((r) => r.data),
    closeById: (id: string, physicalCount: number) =>
      api.post(`/cash/close/${id}`, { physicalCount }).then((r) => r.data),
    outflow: (data: {
      type?: "EXPENSE" | "BILL" | "PRODUCT" | "RESERVE";
      amount?: number;
      reason?: string;
      category?: string;
      supplier?: string;
      source?: string;
      billId?: string;
      productId?: string;
      quantity?: number;
    }) => api.post("/cash/outflow", data).then((r) => r.data),
  },

  settings: {
    get: (key: string) => api.get(`/settings/${key}`).then((r) => r.data),
    set: (key: string, value: string) =>
      api.put(`/settings/${key}`, { value }).then((r) => r.data),
  },

  auth: {
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      api.patch("/auth/change-password", data).then((r) => r.data),
  },

  appointments: {
    listByDate: (date: string) =>
      api.get(`/appointments?date=${date}`).then((r) => r.data),
    getSlots: (date: string, serviceId: string) =>
      api
        .get(`/appointments/slots?date=${date}&serviceId=${serviceId}`)
        .then((r) => r.data),
    updateStatus: (id: string, status: string) =>
      api.put(`/appointments/${id}`, { status }).then((r) => r.data),
    remove: (id: string) =>
      api.delete(`/appointments/${id}`).then((r) => r.data),
  },

  stock: {
    products: (activeOnly = false) =>
      api
        .get(`/stock/products${activeOnly ? "?activeOnly=true" : ""}`)
        .then((r) => r.data),
    createProduct: (data: {
      name: string;
      unit?: string;
      minQuantity?: number;
      costPrice?: number;
    }) => api.post("/stock/products", data).then((r) => r.data),
    updateProduct: (id: string, data: any) =>
      api.put(`/stock/products/${id}`, data).then((r) => r.data),
    deleteProduct: (id: string) =>
      api.delete(`/stock/products/${id}`).then((r) => r.data),
    addEntry: (
      productId: string,
      data: {
        quantity: number;
        costPrice?: number;
        supplier?: string;
        notes?: string;
      },
    ) =>
      api
        .post(`/stock/products/${productId}/entries`, data)
        .then((r) => r.data),
    history: (productId: string) =>
      api.get(`/stock/products/${productId}/history`).then((r) => r.data),
    addUsage: (data: {
      serviceOrderId: string;
      productId: string;
      quantity: number;
    }) => api.post("/stock/usages", data).then((r) => r.data),
    alerts: () => api.get("/stock/alerts").then((r) => r.data),
    intelligence: () => api.get("/stock/intelligence").then((r) => r.data),
    submitCount: (
      items: { productId: string; quantity: number }[],
      notes?: string,
    ) => api.post("/stock/count", { items, notes }).then((r) => r.data),
    recentCounts: () => api.get("/stock/counts").then((r) => r.data),
  },

  bills: {
    list: (status?: string) =>
      api
        .get("/bills", { params: status ? { status } : undefined })
        .then((r) => r.data),
    summary: () => api.get("/bills/summary").then((r) => r.data),
    create: (data: {
      name: string;
      category: string;
      amount: number;
      dueDate: string;
      notes?: string;
      recurring?: boolean;
    }) => api.post("/bills", data).then((r) => r.data),
    update: (id: string, data: any) =>
      api.put(`/bills/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/bills/${id}`).then((r) => r.data),
    markPaid: (id: string) =>
      api.put(`/bills/${id}`, { status: "PAGO" }).then((r) => r.data),
  },

  users: {
    list: () => api.get("/users").then((r) => r.data),
    create: (data: {
      email: string;
      name: string;
      password: string;
      role: string;
    }) => api.post("/users", data).then((r) => r.data),
    update: (
      id: string,
      data: { name?: string; role?: string; password?: string },
    ) => api.put(`/users/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/users/${id}`),
  },
};
