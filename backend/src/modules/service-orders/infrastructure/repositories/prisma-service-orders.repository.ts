import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateServiceOrderDto } from '../../application/dtos/create-service-order.dto';
import { UpdateServiceOrderDto } from '../../application/dtos/update-service-order.dto';

const include = {
  client: { select: { id: true, name: true, phone: true } },
  vehicle: { select: { id: true, plate: true, model: true, color: true } },
  service: { select: { id: true, name: true, price: true } },
};

@Injectable()
export class PrismaServiceOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { status?: string; date?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.date) {
      const d = new Date(filters.date);
      where.createdAt = { gte: new Date(d.setHours(0, 0, 0, 0)), lte: new Date(d.setHours(23, 59, 59, 999)) };
    }
    return this.prisma.serviceOrder.findMany({ where, include, orderBy: { createdAt: 'desc' } });
  }

  findToday() {
    const now = new Date();
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));
    return this.prisma.serviceOrder.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.serviceOrder.findUnique({ where: { id }, include });
  }

  create(dto: CreateServiceOrderDto) {
    return this.prisma.serviceOrder.create({ data: dto, include });
  }

  update(id: string, dto: UpdateServiceOrderDto) {
    return this.prisma.serviceOrder.update({ where: { id }, data: dto, include });
  }

  remove(id: string) {
    return this.prisma.serviceOrder.delete({ where: { id } });
  }
}
