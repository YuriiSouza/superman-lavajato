import { Module } from '@nestjs/common';
import { PrismaServicesRepository } from './infrastructure/repositories/prisma-services.repository';
import { ServicesController } from './presentation/controllers/services.controller';

@Module({
  providers: [PrismaServicesRepository],
  controllers: [ServicesController],
  exports: [PrismaServicesRepository],
})
export class ServicesModule {}
