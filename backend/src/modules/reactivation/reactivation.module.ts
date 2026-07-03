import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { GetReactivationQueueUseCase } from "./application/use-cases/get-reactivation-queue.use-case";
import { ReactivationController } from "./presentation/controllers/reactivation.controller";

@Module({
  imports: [PrismaModule],
  providers: [GetReactivationQueueUseCase],
  controllers: [ReactivationController],
})
export class ReactivationModule {}
