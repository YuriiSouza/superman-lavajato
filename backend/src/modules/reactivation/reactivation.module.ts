import { Module } from '@nestjs/common';
import { GetReactivationQueueUseCase } from './application/use-cases/get-reactivation-queue.use-case';
import { ReactivationController } from './presentation/controllers/reactivation.controller';

@Module({
  providers: [GetReactivationQueueUseCase],
  controllers: [ReactivationController],
})
export class ReactivationModule {}
