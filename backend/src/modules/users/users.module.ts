import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { BcryptService } from "../auth/infrastructure/services/bcrypt.service";

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [BcryptService],
})
export class UsersModule {}
