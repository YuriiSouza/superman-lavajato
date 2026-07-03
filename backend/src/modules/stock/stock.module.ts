import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { StockController } from "./presentation/controllers/stock.controller";

@Module({
  imports: [PrismaModule],
  controllers: [StockController],
})
export class StockModule {}
