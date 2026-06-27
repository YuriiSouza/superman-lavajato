import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class GetSegmentsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const clients = await this.prisma.client.findMany({
      include: {
        vehicles: { select: { type: true } },
        orders: {
          where: { status: 'CONCLUIDO' },
          select: { totalValue: true, createdAt: true, serviceId: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const vip: any[] = [];
    const regular: any[] = [];
    const churn: any[] = [];
    const premium: any[] = [];

    for (const client of clients) {
      const completedOrders = client.orders;
      if (!completedOrders.length) { churn.push(client); continue; }

      const lastOrder = completedOrders[0];
      const lastDate = new Date(lastOrder.createdAt);
      const daysSinceLast = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
      const avgTicket = completedOrders.reduce((s, o) => s + Number(o.totalValue), 0) / completedOrders.length;
      const hasPremiumVehicle = client.vehicles.some((v) => v.type === 'SUV' || v.type === 'PICKUP');

      const enriched = { ...client, daysSinceLast, avgTicket: Math.round(avgTicket * 100) / 100 };

      if (daysSinceLast > 30) { churn.push(enriched); continue; }
      if (hasPremiumVehicle) premium.push(enriched);
      // VIP e regular não são mutuamente exclusivos com premium — um cliente SUV frequente entra nos dois
      if (completedOrders.length >= 4 && daysSinceLast <= 7) vip.push(enriched);
      else regular.push(enriched);
    }

    return {
      vip: { label: 'VIP — Alta frequência', count: vip.length, clients: vip },
      regular: { label: 'Regulares', count: regular.length, clients: regular },
      churn: { label: 'Em risco de churn', count: churn.length, clients: churn },
      premium: { label: 'Veículo premium', count: premium.length, clients: premium },
    };
  }
}
