import { Module } from '@nestjs/common';
import { GetFinancialUseCase } from './application/use-cases/get-financial.use-case';
import { FinancialController } from './presentation/controllers/financial.controller';

@Module({
  providers: [GetFinancialUseCase],
  controllers: [FinancialController],
})
export class FinancialModule {}
