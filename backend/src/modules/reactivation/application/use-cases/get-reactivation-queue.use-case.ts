import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class GetReactivationQueueUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(thresholdDays = 30) {
    const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

    const clients = await this.prisma.client.findMany({
      include: {
        vehicles: { select: { plate: true, model: true, color: true } },
        orders: {
          where: { status: 'CONCLUIDO' },
          select: { createdAt: true, totalValue: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const queue = clients
      .filter((c) => {
        const last = c.orders[0];
        if (!last) return true;
        return new Date(last.createdAt) < cutoff;
      })
      .map((c) => {
        const lastOrder = c.orders[0];
        const daysSince = lastOrder
          ? Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / 86400000)
          : null;
        const vehicle = c.vehicles[0];
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          vehicle: vehicle ? `${vehicle.model} ${vehicle.color ?? ''}`.trim() : null,
          plate: vehicle?.plate ?? null,
          daysSince,
          lastVisit: lastOrder?.createdAt ?? null,
          whatsappMessage: `Oi ${c.name.split(' ')[0]}! Já faz ${daysSince ?? 'um tempo'} dias que o seu ${vehicle?.model ?? 'carro'} não aparece aqui. Que tal dar um pulinho? 🦸`,
        };
      })
      .sort((a, b) => (b.daysSince ?? 9999) - (a.daysSince ?? 9999));

    return { total: queue.length, threshold: thresholdDays, queue };
  }
}
