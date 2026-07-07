import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
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

// Chaves de cache relacionadas a OS — invalidadas em qualquer mutação
const OS_CACHE_KEYS = ["os:today", "os:list", "cash:today"];

@Injectable()
export class PrismaServiceOrdersRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private async invalidateOsCache() {
    await Promise.all(OS_CACHE_KEYS.map((k) => this.cache.del(k)));
  }

  async findAll(filters?: {
    status?: string;
    date?: string;
    serviceId?: string;
  }) {
    // Cache de 15s para listagem com filtros (chave inclui filtros)
    const cacheKey = `os:list:${JSON.stringify(filters ?? {})}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

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
    const result = await this.prisma.serviceOrder.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });

    await this.cache.set(cacheKey, result, 15_000);
    return result;
  }

  async findToday() {
    const cached = await this.cache.get("os:today");
    if (cached) return cached;

    const now = new Date();
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));
    const result = await this.prisma.serviceOrder.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include,
      orderBy: { createdAt: "desc" },
    });

    await this.cache.set("os:today", result, 15_000);
    return result;
  }

  findOne(id: string) {
    return this.prisma.serviceOrder.findUnique({ where: { id }, include });
  }

  async create(dto: CreateServiceOrderDto) {
    const { scheduledAt, ...rest } = dto as any;
    const data: any = { ...rest };
    if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
    const result = await this.prisma.serviceOrder.create({ data, include });
    await this.invalidateOsCache();
    return result;
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
      const result = await this.prisma.$transaction(async (tx) => {
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
      await this.invalidateOsCache();
      return result;
    }

    const result = await this.prisma.serviceOrder.update({
      where: { id },
      data: rest,
      include,
    });
    await this.invalidateOsCache();
    return result;
  }

  async remove(id: string) {
    const result = await this.prisma.serviceOrder.delete({ where: { id } });
    await this.invalidateOsCache();
    return result;
  }
}
