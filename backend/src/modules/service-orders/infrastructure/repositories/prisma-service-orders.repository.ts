import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import { CreateServiceOrderDto } from "../../application/dtos/create-service-order.dto";
import { UpdateServiceOrderDto } from "../../application/dtos/update-service-order.dto";

const include = {
  client: { select: { id: true, name: true, phone: true } },
  vehicle: { select: { id: true, plate: true, model: true, color: true } },
  service: {
    select: {
      id: true,
      name: true,
      price: true,
      category: { select: { id: true, name: true, requiresVehicle: true } },
    },
  },
  payments: true,
};

@Injectable()
export class PrismaServiceOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { status?: string; date?: string; serviceId?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.serviceId) where.serviceId = filters.serviceId;
    if (filters?.date) {
      const d = new Date(filters.date);
      where.createdAt = {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
    return this.prisma.serviceOrder.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });
  }

  findToday() {
    const now = new Date();
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));
    return this.prisma.serviceOrder.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include,
      orderBy: { createdAt: "desc" },
    });
  }

  findOne(id: string) {
    return this.prisma.serviceOrder.findUnique({ where: { id }, include });
  }

  create(dto: CreateServiceOrderDto) {
    const { scheduledAt, ...rest } = dto as any;
    const data: any = { ...rest };
    if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
    return this.prisma.serviceOrder.create({ data, include });
  }

  async update(
    id: string,
    dto: UpdateServiceOrderDto & {
      payments?: { method: string; amount: number }[];
    },
  ) {
    const { payments, ...rest } = dto as any;

    // Se está sendo marcado como PAGO e vieram entradas de pagamento, registra em transação
    if (rest.status === "PAGO" && payments?.length) {
      return this.prisma.$transaction(async (tx) => {
        // Remove pagamentos anteriores (reabertura de caixa ou correção)
        await tx.orderPayment.deleteMany({ where: { serviceOrderId: id } });

        await tx.orderPayment.createMany({
          data: payments.map((p: any) => ({
            serviceOrderId: id,
            method: p.method,
            amount: p.amount,
          })),
        });

        // paymentMethod no summary: único método ou null para múltiplos
        const summaryMethod = payments.length === 1 ? payments[0].method : null;

        return tx.serviceOrder.update({
          where: { id },
          data: { ...rest, paymentMethod: summaryMethod },
          include,
        });
      });
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: rest,
      include,
    });
  }

  remove(id: string) {
    return this.prisma.serviceOrder.delete({ where: { id } });
  }
}
