import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";
import { JwtAuthGuard } from "../../../auth/presentation/guards/jwt-auth.guard";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";

const CATEGORIES = [
  "PRODUTO",
  "COMBUSTIVEL",
  "MANUTENCAO",
  "SALARIO",
  "ALUGUEL",
  "CONTA",
  "OUTRO",
] as const;
const STATUSES = ["PENDENTE", "PAGO", "VENCIDO"] as const;

class CreateBillDto {
  @IsString() name: string;
  @IsEnum(CATEGORIES) category: (typeof CATEGORIES)[number];
  @IsNumber() @Type(() => Number) amount: number;
  @IsDateString() dueDate: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() recurring?: boolean;
}

class UpdateBillDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(CATEGORIES) category?: (typeof CATEGORIES)[number];
  @IsOptional() @IsNumber() @Type(() => Number) amount?: number;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(STATUSES) status?: (typeof STATUSES)[number];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() recurring?: boolean;
}

@ApiTags("bills")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("bills")
export class BillsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Listar contas a pagar" })
  @ApiQuery({ name: "status", required: false })
  async list(@Query("status") status?: string) {
    // atualiza automaticamente contas vencidas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.prisma.bill.updateMany({
      where: { status: "PENDENTE", dueDate: { lt: today } },
      data: { status: "VENCIDO" },
    });

    return this.prisma.bill.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { dueDate: "asc" },
    });
  }

  @Post()
  @ApiOperation({ summary: "Criar conta a pagar" })
  async create(@Body() dto: CreateBillDto) {
    return this.prisma.bill.create({
      data: {
        name: dto.name,
        category: dto.category,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
        recurring: dto.recurring ?? false,
      },
    });
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar conta" })
  async update(@Param("id") id: string, @Body() dto: UpdateBillDto) {
    const data: any = { ...dto };
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.status === "PAGO") data.paidAt = new Date();
    return this.prisma.bill.update({ where: { id }, data });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover conta" })
  async remove(@Param("id") id: string) {
    return this.prisma.bill.delete({ where: { id } });
  }

  @Get("summary")
  @ApiOperation({
    summary: "Resumo financeiro: total pendente, vencido, pago no mês",
  })
  async summary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [pending, overdue, paidThisMonth] = await Promise.all([
      this.prisma.bill.aggregate({
        where: { status: "PENDENTE" },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.bill.aggregate({
        where: { status: "VENCIDO" },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.bill.aggregate({
        where: {
          status: "PAGO",
          paidAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      pending: {
        total: Number(pending._sum.amount ?? 0),
        count: pending._count,
      },
      overdue: {
        total: Number(overdue._sum.amount ?? 0),
        count: overdue._count,
      },
      paidThisMonth: {
        total: Number(paidThisMonth._sum.amount ?? 0),
        count: paidThisMonth._count,
      },
    };
  }
}
