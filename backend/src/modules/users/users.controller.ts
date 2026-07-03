import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Request,
} from "@nestjs/common";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { JwtAuthGuard } from "../auth/presentation/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/presentation/guards/roles.guard";
import { Roles } from "../auth/presentation/decorators/roles.decorator";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { BcryptService } from "../auth/infrastructure/services/bcrypt.service";

class CreateUserDto {
  @IsEmail() email: string;
  @IsString() name: string;
  @MinLength(6) password: string;
  @IsEnum(["ADMIN", "CAIXA", "OPERADOR"]) role: "ADMIN" | "CAIXA" | "OPERADOR";
}

class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(["ADMIN", "CAIXA", "OPERADOR"]) role?:
    "ADMIN" | "CAIXA" | "OPERADOR";
  @IsOptional() @MinLength(6) password?: string;
}

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "CAIXA")
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
  ) {}

  @Get()
  async list() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateUserDto) {
    if (req.user.role === "CAIXA" && dto.role === "ADMIN") {
      throw new ForbiddenException(
        "Caixa não pode criar usuários Administrador.",
      );
    }
    const hashed = await this.bcrypt.hash(dto.password);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashed,
        role: dto.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  @Put(":id")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
  ) {
    if (req.user.role === "CAIXA") {
      const target = await this.prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });
      if (target?.role === "ADMIN" || dto.role === "ADMIN") {
        throw new ForbiddenException(
          "Caixa não pode editar ou promover usuários Administrador.",
        );
      }
    }
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.role) data.role = dto.role;
    if (dto.password) data.password = await this.bcrypt.hash(dto.password);
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req: any, @Param("id") id: string) {
    if (req.user.role === "CAIXA") {
      const target = await this.prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });
      if (target?.role === "ADMIN") {
        throw new ForbiddenException(
          "Caixa não pode remover usuários Administrador.",
        );
      }
    }
    await this.prisma.user.delete({ where: { id } });
  }
}
