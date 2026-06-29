import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { CashController } from './presentation/controllers/cash.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CashController],
})
export class CashModule {}
