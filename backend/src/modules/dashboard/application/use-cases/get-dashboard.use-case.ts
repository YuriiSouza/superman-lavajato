import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";

@Injectable()
export class GetDashboardUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayOrders,
      monthOrders,
      totalClients,
      churnClients,
      pendingCount,
      activeCount,
    ] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: "PAGO",
        },
        select: { totalValue: true, paymentMethod: true },
      }),
      this.prisma.serviceOrder.findMany({
        where: { createdAt: { gte: monthStart }, status: "PAGO" },
        select: { totalValue: true },
      }),
      this.prisma.client.count(),
      this.prisma.client.count({
        where: {
          orders: {
            none: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
              status: "PAGO",
            },
          },
        },
      }),
      this.prisma.serviceOrder.count({ where: { status: "PENDENTE" } }),
      this.prisma.serviceOrder.count({ where: { status: "EM_ANDAMENTO" } }),
    ]);

    const todayRevenue = todayOrders.reduce(
      (s, o) => s + Number(o.totalValue),
      0,
    );
    const monthRevenue = monthOrders.reduce(
      (s, o) => s + Number(o.totalValue),
      0,
    );
    const avgTicket = todayOrders.length
      ? todayRevenue / todayOrders.length
      : 0;

    const byPayment = todayOrders.reduce((acc: Record<string, number>, o) => {
      acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + Number(o.totalValue);
      return acc;
    }, {});

    return {
      today: {
        ordersCount: todayOrders.length,
        revenue: todayRevenue,
        avgTicket: Math.round(avgTicket * 100) / 100,
        byPayment,
      },
      month: { revenue: monthRevenue, ordersCount: monthOrders.length },
      clients: { total: totalClients, churn: churnClients },
      orders: { pending: pendingCount, active: activeCount },
    };
  }
}
