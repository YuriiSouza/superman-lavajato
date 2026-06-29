import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

const DEFAULT_TEMPLATE =
  'Oi [primeiro_nome]! Já faz [dias] dias que o seu [carro] não aparece aqui. Que tal dar um pulinho? 🦸';

function applyTemplate(
  template: string,
  vars: { nome: string; primeiro_nome: string; carro: string; placa: string; dias: string },
): string {
  return template
    .replace(/\[nome\]/g, vars.nome)
    .replace(/\[primeiro_nome\]/g, vars.primeiro_nome)
    .replace(/\[carro\]/g, vars.carro)
    .replace(/\[placa\]/g, vars.placa)
    .replace(/\[dias\]/g, vars.dias);
}

@Injectable()
export class GetReactivationQueueUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(thresholdDays = 30) {
    const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

    const [clients, templateSetting] = await Promise.all([
      this.prisma.client.findMany({
        include: {
          vehicles: { select: { plate: true, model: true, color: true } },
          orders: {
            where: { status: { in: ['CONCLUIDO', 'PAGO'] } },
            select: { createdAt: true, totalValue: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          reactivationLogs: {
            orderBy: { sentAt: 'desc' },
            take: 1,
            select: { sentAt: true, message: true },
          },
        },
      }),
      this.prisma.setting.findUnique({ where: { key: 'reactivation_template' } }),
    ]);

    const template = templateSetting?.value ?? DEFAULT_TEMPLATE;

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
        const carro = vehicle ? `${vehicle.model}${vehicle.color ? ' ' + vehicle.color : ''}`.trim() : 'carro';
        const placa = vehicle?.plate ?? '';

        const lastContact = c.reactivationLogs[0] ?? null;

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          vehicle: vehicle ? carro : null,
          plate: placa || null,
          daysSince,
          lastVisit: lastOrder?.createdAt ?? null,
          lastContact: lastContact
            ? { sentAt: lastContact.sentAt, message: lastContact.message }
            : null,
          whatsappMessage: applyTemplate(template, {
            nome: c.name,
            primeiro_nome: c.name.split(' ')[0],
            carro,
            placa,
            dias: daysSince != null ? String(daysSince) : 'um tempo',
          }),
        };
      })
      .sort((a, b) => (b.daysSince ?? 9999) - (a.daysSince ?? 9999));

    return { total: queue.length, threshold: thresholdDays, queue };
  }
}
