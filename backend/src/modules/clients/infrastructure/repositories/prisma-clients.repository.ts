import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import { CreateClientDto } from "../../application/dtos/create-client.dto";
import { UpdateClientDto } from "../../application/dtos/update-client.dto";

@Injectable()
export class PrismaClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, limit = 50, offset = 0) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
            {
              vehicles: {
                some: {
                  plate: { contains: search, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : undefined;

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: { vehicles: true, _count: { select: { orders: true } } },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, limit, offset };
  }

  findOne(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        vehicles: true,
        orders: {
          include: { service: true, vehicle: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  update(id: string, dto: UpdateClientDto) {
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.client.delete({ where: { id } });
  }

  findLastOrderDate(clientId: string) {
    return this.prisma.serviceOrder.findFirst({
      where: { clientId, status: { in: ["CONCLUIDO", "PAGO"] } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
  }
}
