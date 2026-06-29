import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

interface SummaryParams {
  period?: string;
  start?: string;
  end?: string;
  serviceId?: string;
}

interface ProgressionParams {
  days?: number;
  start?: string;
  end?: string;
  serviceId?: string;
}

@Injectable()
export class GetFinancialUseCase {
  constructor(private readonly prisma: PrismaService) {}

  private resolveRange(params: SummaryParams): { start: Date; end: Date } {
    if (params.start) {
      return {
        start: new Date(params.start),
        end: params.end ? new Date(params.end) : new Date(),
      };
    }
    const now = new Date();
    const period = params.period ?? 'month';
    let start: Date;
    if (period === 'day') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === 'week') { start = new Date(now); start.setDate(now.getDate() - 7); }
    else if (period === 'year') start = new Date(now.getFullYear(), 0, 1);
    else start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: now };
  }

  async summary(params: SummaryParams) {
    const { start, end } = this.resolveRange(params);
    const where: any = { createdAt: { gte: start, lte: end }, status: 'PAGO' };
    if (params.serviceId) where.serviceId = params.serviceId;

    const orders = await this.prisma.serviceOrder.findMany({
      where,
      include: { service: { select: { name: true } } },
    });

    const total = orders.reduce((s, o) => s + Number(o.totalValue), 0);
    const avgTicket = orders.length ? total / orders.length : 0;

    const byService = orders.reduce((acc: Record<string, { count: number; revenue: number }>, o) => {
      const name = o.service.name;
      if (!acc[name]) acc[name] = { count: 0, revenue: 0 };
      acc[name].count++;
      acc[name].revenue += Number(o.totalValue);
      return acc;
    }, {});

    const byPayment = orders.reduce((acc: Record<string, number>, o) => {
      acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + Number(o.totalValue);
      return acc;
    }, {});

    return {
      total,
      ordersCount: orders.length,
      avgTicket: Math.round(avgTicket * 100) / 100,
      byService,
      byPayment,
    };
  }

  async dailyRevenue(params: ProgressionParams) {
    let start: Date;
    let end = new Date();

    if (params.start) {
      start = new Date(params.start);
      if (params.end) end = new Date(params.end);
    } else {
      const days = Math.min(params.days ?? 30, 365);
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      start.setDate(start.getDate() - days + 1);
    }

    const where: any = { createdAt: { gte: start, lte: end }, status: 'PAGO' };
    if (params.serviceId) where.serviceId = params.serviceId;

    const orders = await this.prisma.serviceOrder.findMany({
      where,
      select: { totalValue: true, createdAt: true },
    });

    // Build a slot for every calendar day in range
    const byDay: Record<string, number> = {};
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cur <= endDay) {
      byDay[cur.toISOString().split('T')[0]] = 0;
      cur.setDate(cur.getDate() + 1);
    }

    for (const o of orders) {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (key in byDay) byDay[key] += Number(o.totalValue);
    }

    return Object.entries(byDay).map(([date, revenue]) => ({ date, revenue }));
  }

  async revenueByServiceByDay(params: ProgressionParams) {
    let start: Date;
    let end = new Date();

    if (params.start) {
      start = new Date(params.start);
      if (params.end) end = new Date(params.end);
    } else {
      const days = Math.min(params.days ?? 30, 365);
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      start.setDate(start.getDate() - days + 1);
    }

    const orders = await this.prisma.serviceOrder.findMany({
      where: { createdAt: { gte: start, lte: end }, status: 'PAGO' },
      select: { createdAt: true, totalValue: true, service: { select: { name: true } } },
    });

    const byDay: Record<string, Record<string, number>> = {};
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cur <= endDay) {
      byDay[cur.toISOString().split('T')[0]] = {};
      cur.setDate(cur.getDate() + 1);
    }

    const serviceNames = new Set<string>();
    for (const o of orders) {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      const svc = o.service.name;
      serviceNames.add(svc);
      if (key in byDay) {
        byDay[key][svc] = (byDay[key][svc] ?? 0) + Number(o.totalValue);
      }
    }

    const services = [...serviceNames].sort();
    const days2 = Object.entries(byDay).map(([date, vals]) => ({
      date,
      ...Object.fromEntries(services.map((s) => [s, vals[s] ?? 0])),
    }));

    return { services, days: days2 };
  }

  async heatmap(days = 90) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const orders = await this.prisma.serviceOrder.findMany({
      where: { createdAt: { gte: start }, status: 'PAGO' },
      select: { createdAt: true },
    });

    // 7 × 24 matrix — index 0 = Sunday
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const o of orders) {
      const d = new Date(o.createdAt);
      matrix[d.getDay()][d.getHours()]++;
    }

    return { matrix, days };
  }
}
