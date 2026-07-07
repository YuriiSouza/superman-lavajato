import useSWR, { SWRConfiguration } from "swr";
import { crm } from "./api";

// Configuração padrão: revalida ao focar a aba, não re-fetcha se dados < 30s
const DEFAULT_CONFIG: SWRConfiguration = {
  revalidateOnFocus: true,
  dedupingInterval: 30_000,
};

// Configuração para dados lentos (segmentos, reativação) — TTL mais longo
const SLOW_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 120_000,
};

export function useDashboard() {
  return useSWR("dashboard", () => crm.dashboard(), {
    ...DEFAULT_CONFIG,
    refreshInterval: 30_000,
  });
}

export function useSegments() {
  return useSWR("segments", () => crm.segments(), SLOW_CONFIG);
}

export function useClients(search?: string, limit = 50, offset = 0) {
  const key = `clients:${search ?? ""}:${limit}:${offset}`;
  return useSWR(
    key,
    () => crm.clients.list(search, limit, offset),
    DEFAULT_CONFIG,
  );
}

export function useServices() {
  // Serviços raramente mudam — cache longo
  return useSWR("services", () => crm.services.list(), {
    dedupingInterval: 300_000,
    revalidateOnFocus: false,
  });
}

export function useOrders(params?: {
  status?: string;
  date?: string;
  serviceId?: string;
}) {
  const key = `orders:${JSON.stringify(params ?? {})}`;
  return useSWR(key, () => crm.orders.list(params), DEFAULT_CONFIG);
}

export function useOrdersToday() {
  return useSWR("orders:today", () => crm.orders.today(), {
    ...DEFAULT_CONFIG,
    refreshInterval: 60_000,
  });
}

export function useReactivationQueue(days = 30) {
  return useSWR(
    `reactivation:${days}`,
    () => crm.reactivation.queue(days),
    SLOW_CONFIG,
  );
}

export function useFinancialSummary(params?: {
  period?: string;
  start?: string;
  end?: string;
  serviceId?: string;
}) {
  const key = `financial:summary:${JSON.stringify(params ?? {})}`;
  return useSWR(key, () => crm.financial.summary(params), DEFAULT_CONFIG);
}

export function useFinancialProgression(params?: {
  days?: number;
  start?: string;
  end?: string;
  serviceId?: string;
}) {
  const key = `financial:progression:${JSON.stringify(params ?? {})}`;
  return useSWR(key, () => crm.financial.progression(params), DEFAULT_CONFIG);
}

export function useHeatmap(days = 90) {
  return useSWR(
    `financial:heatmap:${days}`,
    () => crm.financial.heatmap(days),
    {
      dedupingInterval: 300_000,
      revalidateOnFocus: false,
    },
  );
}

export function useBills(status?: string) {
  return useSWR(
    `bills:${status ?? "all"}`,
    () => crm.bills.list(status),
    DEFAULT_CONFIG,
  );
}

export function useStockIntelligence() {
  return useSWR("stock:intelligence", () => crm.stock.intelligence(), {
    dedupingInterval: 120_000,
    revalidateOnFocus: false,
  });
}

export function useReservesSummary() {
  return useSWR(
    "financial:reserves:summary",
    () => crm.financial.reserves.summary(),
    DEFAULT_CONFIG,
  );
}
