import { Module } from "@nestjs/common";
import { PrismaClientsRepository } from "./infrastructure/repositories/prisma-clients.repository";
import { ClientsController } from "./presentation/controllers/clients.controller";

@Module({
  providers: [PrismaClientsRepository],
  controllers: [ClientsController],
  exports: [PrismaClientsRepository],
})
export class ClientsModule {}
