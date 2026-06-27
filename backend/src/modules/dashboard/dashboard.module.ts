import { Module } from '@nestjs/common';
import { GetDashboardUseCase } from './application/use-cases/get-dashboard.use-case';
import { DashboardController } from './presentation/controllers/dashboard.controller';

@Module({
  providers: [GetDashboardUseCase],
  controllers: [DashboardController],
})
export class DashboardModule {}
