import { Module } from '@nestjs/common';
import { PrismaServicesRepository } from './infrastructure/repositories/prisma-services.repository';
import { ServicesController } from './presentation/controllers/services.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PrismaServicesRepository],
  controllers: [ServicesController],
  exports: [PrismaServicesRepository],
})
export class ServicesModule {}
