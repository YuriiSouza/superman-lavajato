import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class GetFinancialUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async summary(period: 'day' | 'week' | 'month') {
    const now = new Date();
    let start: Date;

    if (period === 'day') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === 'week') { start = new Date(now); start.setDate(now.getDate() - 7); }
    else { start = new Date(now.getFullYear(), now.getMonth(), 1); }

    const orders = await this.prisma.serviceOrder.findMany({
      where: { createdAt: { gte: start }, status: 'CONCLUIDO' },
      include: { service: { select: { name: true } } },
    });

    const total = orders.reduce((s, o) => s + Number(o.totalValue), 0);

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

    return { period, total, ordersCount: orders.length, byService, byPayment };
  }
}
