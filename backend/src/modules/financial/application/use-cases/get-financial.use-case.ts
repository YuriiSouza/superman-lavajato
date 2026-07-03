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

  async byVehicleType(days = 90) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const orders = await this.prisma.serviceOrder.findMany({
      where: { createdAt: { gte: start }, status: 'PAGO' },
      select: { totalValue: true, vehicle: { select: { type: true } } },
    });

    const map: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      const type = o.vehicle?.type ?? 'OUTRO';
      if (!map[type]) map[type] = { count: 0, revenue: 0 };
      map[type].count++;
      map[type].revenue += Number(o.totalValue);
    }

    return Object.entries(map)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count);
  }

  private async calcCmv(start: Date, end: Date): Promise<number> {
    const [allCounts, entries, products] = await Promise.all([
      this.prisma.stockCount.findMany({
        orderBy: { countedAt: 'desc' },
        select: { productId: true, quantity: true, costPrice: true, countedAt: true },
      }),
      this.prisma.stockEntry.findMany({
        where: { createdAt: { gte: start, lte: end }, costPrice: { not: null } },
        select: { productId: true, quantity: true, costPrice: true },
      }),
      this.prisma.product.findMany({ select: { id: true, costPrice: true } }),
    ]);

    let cmv = 0;
    for (const product of products) {
      const productCounts = allCounts.filter((c) => c.productId === product.id);
      const fallbackCost  = Number(product.costPrice ?? 0);
      const costOf = (c: typeof productCounts[0]) => Number(c.costPrice ?? fallbackCost);

      const opening = productCounts.find((c) => new Date(c.countedAt) <= start);
      const closing = productCounts.find((c) => new Date(c.countedAt) <= end);
      if (!opening && !closing) continue;

      const openingValue   = opening ? Number(opening.quantity) * costOf(opening) : 0;
      const closingValue   = closing ? Number(closing.quantity) * costOf(closing) : 0;
      const purchasesCost  = entries
        .filter((e) => e.productId === product.id)
        .reduce((s, e) => s + Number(e.quantity) * Number(e.costPrice), 0);

      cmv += openingValue + purchasesCost - closingValue;
    }
    return Math.round(cmv * 100) / 100;
  }

  async profit(params: { start?: string; end?: string; period?: string }) {
    const { start, end } = this.resolveRange(params);

    const [orders, outflows, bills, cmv] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where: { status: 'PAGO', updatedAt: { gte: start, lte: end } },
        select: { totalValue: true },
      }),
      this.prisma.cashOutflow.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { amount: true },
      }),
      this.prisma.bill.findMany({
        where: { status: 'PAGO', paidAt: { gte: start, lte: end } },
        select: { amount: true },
      }),
      this.calcCmv(start, end),
    ]);

    const revenue   = orders.reduce((s, o) => s + Number(o.totalValue), 0);
    const opex      = outflows.reduce((s, o) => s + Number(o.amount), 0);
    const billsPaid = bills.reduce((s, b) => s + Number(b.amount), 0);
    const expenses  = opex + billsPaid;
    const netProfit = revenue - expenses - cmv;

    return {
      revenue:    Math.round(revenue    * 100) / 100,
      expenses:   Math.round(expenses   * 100) / 100,
      cmv:        Math.round(cmv        * 100) / 100,
      opex:       Math.round(opex       * 100) / 100,
      billsPaid:  Math.round(billsPaid  * 100) / 100,
      netProfit:  Math.round(netProfit  * 100) / 100,
    };
  }

  async dre(months = 6) {
    const now = new Date();

    // Build month ranges: from `months` ago up to now
    const ranges: { label: string; start: Date; end: Date }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = i === 0
        ? now
        : new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = start.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      ranges.push({ label, start, end });
    }

    const periodStart = ranges[0].start;

    // Fetch financial data + stock data for CMV in parallel
    const [orders, outflows, bills, allCounts, allEntries, products] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where: { status: 'PAGO', updatedAt: { gte: periodStart, lte: now } },
        select: { totalValue: true, updatedAt: true },
      }),
      this.prisma.cashOutflow.findMany({
        where: { createdAt: { gte: periodStart, lte: now } },
        select: { amount: true, createdAt: true },
      }),
      this.prisma.bill.findMany({
        where: { status: 'PAGO', paidAt: { gte: periodStart, lte: now } },
        select: { amount: true, paidAt: true },
      }),
      this.prisma.stockCount.findMany({
        orderBy: { countedAt: 'desc' },
        select: { productId: true, quantity: true, costPrice: true, countedAt: true },
      }),
      this.prisma.stockEntry.findMany({
        where: { createdAt: { gte: periodStart, lte: now }, costPrice: { not: null } },
        select: { productId: true, quantity: true, costPrice: true, createdAt: true },
      }),
      this.prisma.product.findMany({ select: { id: true, costPrice: true } }),
    ]);

    // Helper: CMV for an arbitrary [start, end] range using pre-fetched data
    const cmvForRange = (start: Date, end: Date): number => {
      let cmv = 0;
      for (const product of products) {
        const productCounts = allCounts.filter((c) => c.productId === product.id);
        const fallbackCost  = Number(product.costPrice ?? 0);
        const costOf = (c: typeof productCounts[0]) => Number(c.costPrice ?? fallbackCost);

        const opening = productCounts.find((c) => new Date(c.countedAt) <= start);
        const closing = productCounts.find((c) => new Date(c.countedAt) <= end);
        if (!opening && !closing) continue;

        const openingValue  = opening ? Number(opening.quantity) * costOf(opening) : 0;
        const closingValue  = closing ? Number(closing.quantity) * costOf(closing) : 0;
        const purchasesCost = allEntries
          .filter((e) => e.productId === product.id && new Date(e.createdAt) >= start && new Date(e.createdAt) <= end)
          .reduce((s, e) => s + Number(e.quantity) * Number(e.costPrice), 0);

        cmv += openingValue + purchasesCost - closingValue;
      }
      return Math.round(cmv * 100) / 100;
    };

    const result = ranges.map(({ label, start, end }) => {
      const inRange = (d: Date) => d >= start && d <= end;

      const revenue = orders
        .filter((o) => inRange(new Date(o.updatedAt)))
        .reduce((s, o) => s + Number(o.totalValue), 0);

      const opex = outflows
        .filter((o) => inRange(new Date(o.createdAt)))
        .reduce((s, o) => s + Number(o.amount), 0);

      const billsPaid = bills
        .filter((b) => b.paidAt && inRange(new Date(b.paidAt)))
        .reduce((s, b) => s + Number(b.amount), 0);

      const cmv = cmvForRange(start, end);
      const expenses = opex + billsPaid;
      const netProfit = revenue - expenses - cmv;

      return {
        label,
        revenue: Math.round(revenue * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        cmv: Math.round(cmv * 100) / 100,
        opex: Math.round(opex * 100) / 100,
        billsPaid: Math.round(billsPaid * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
      };
    });

    const totals = result.reduce(
      (acc, m) => ({
        revenue: acc.revenue + m.revenue,
        expenses: acc.expenses + m.expenses,
        cmv: acc.cmv + m.cmv,
        netProfit: acc.netProfit + m.netProfit,
      }),
      { revenue: 0, expenses: 0, cmv: 0, netProfit: 0 },
    );

    return { months: result, totals };
  }

  async listReservesGrouped() {
    const reserves = await this.prisma.financialReserve.findMany({
      include: {
        bill: { select: { id: true, name: true, amount: true, dueDate: true, status: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by billId
    const byBill = new Map<string, { bill: any; entries: any[] }>();
    for (const r of reserves) {
      if (!byBill.has(r.billId)) {
        byBill.set(r.billId, { bill: r.bill, entries: [] });
      }
      byBill.get(r.billId)!.entries.push({
        id: r.id,
        amount: Number(r.amount),
        description: r.description,
        createdAt: r.createdAt,
      });
    }

    return [...byBill.values()].map(({ bill, entries }) => {
      const reservedTotal = entries.reduce((s, e) => s + e.amount, 0);
      const billAmount = Number(bill.amount);
      return {
        bill,
        reservedTotal: Math.round(reservedTotal * 100) / 100,
        remaining: Math.round(Math.max(0, billAmount - reservedTotal) * 100) / 100,
        pct: billAmount > 0 ? Math.min(100, Math.round((reservedTotal / billAmount) * 100)) : 0,
        reserves: entries,
      };
    });
  }

  async reserveSummary() {
    const all = await this.prisma.financialReserve.findMany({ select: { amount: true } });
    const total = all.reduce((s, r) => s + Number(r.amount), 0);
    return { count: all.length, total: Math.round(total * 100) / 100 };
  }

  async createReserve(data: { billId: string; amount: number; description?: string }) {
    return this.prisma.financialReserve.create({ data });
  }

  async deleteReserve(id: string) {
    return this.prisma.financialReserve.delete({ where: { id } });
  }

  async heatmap(days = 90) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const orders = await this.prisma.serviceOrder.findMany({
      where: { createdAt: { gte: start } },
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
