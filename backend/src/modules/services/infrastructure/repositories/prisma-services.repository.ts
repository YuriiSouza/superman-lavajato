import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import { CreateServiceDto } from "../../application/dtos/create-service.dto";
import { UpdateServiceDto } from "../../application/dtos/update-service.dto";

@Injectable()
export class PrismaServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(activeOnly = false) {
    return this.prisma.service.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: {
        category: { select: { id: true, name: true, requiresVehicle: true } },
      },
      orderBy: { price: "asc" },
    });
  }

  findOne(id: string) {
    return this.prisma.service.findUnique({ where: { id } });
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  update(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }
}
