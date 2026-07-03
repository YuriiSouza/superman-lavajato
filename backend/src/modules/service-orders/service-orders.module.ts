import { Module } from "@nestjs/common";
import { PrismaServiceOrdersRepository } from "./infrastructure/repositories/prisma-service-orders.repository";
import { ServiceOrdersController } from "./presentation/controllers/service-orders.controller";

@Module({
  providers: [PrismaServiceOrdersRepository],
  controllers: [ServiceOrdersController],
  exports: [PrismaServiceOrdersRepository],
})
export class ServiceOrdersModule {}
