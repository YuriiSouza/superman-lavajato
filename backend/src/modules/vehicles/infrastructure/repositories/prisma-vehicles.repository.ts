import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateVehicleDto } from '../../application/dtos/create-vehicle.dto';
import { UpdateVehicleDto } from '../../application/dtos/update-vehicle.dto';

@Injectable()
export class PrismaVehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clientId?: string) {
    return this.prisma.vehicle.findMany({
      where: clientId ? { clientId } : undefined,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { plate: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.vehicle.findUnique({ where: { id }, include: { client: true } });
  }

  findByPlate(plate: string) {
    return this.prisma.vehicle.findUnique({ where: { plate } });
  }

  create(dto: CreateVehicleDto) {
    const data = { ...dto, plate: dto.plate?.trim() || null };
    return this.prisma.vehicle.create({ data, include: { client: true } });
  }

  update(id: string, dto: UpdateVehicleDto) {
    const data = { ...dto, ...(dto.plate !== undefined ? { plate: dto.plate?.trim() || null } : {}) };
    return this.prisma.vehicle.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
