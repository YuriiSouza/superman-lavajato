import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { BillsController } from './presentation/controllers/bills.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BillsController],
})
export class BillsModule {}
