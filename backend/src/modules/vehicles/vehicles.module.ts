import { Module } from '@nestjs/common';
import { PrismaVehiclesRepository } from './infrastructure/repositories/prisma-vehicles.repository';
import { VehiclesController } from './presentation/controllers/vehicles.controller';

@Module({
  providers: [PrismaVehiclesRepository],
  controllers: [VehiclesController],
})
export class VehiclesModule {}
