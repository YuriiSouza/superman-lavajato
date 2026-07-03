import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import { BcryptService } from "../../../auth/infrastructure/services/bcrypt.service";
import { ChangePasswordDto } from "../dtos/change-password.dto";

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const valid = await this.bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException("Senha atual incorreta.");

    const hashed = await this.bcrypt.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  }
}
