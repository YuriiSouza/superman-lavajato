import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/presentation/guards/jwt-auth.guard";
import { GetReactivationQueueUseCase } from "../../application/use-cases/get-reactivation-queue.use-case";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";

@ApiTags("reactivation")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reactivation")
export class ReactivationController {
  constructor(
    private readonly getQueue: GetReactivationQueueUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get("queue")
  @ApiOperation({ summary: "Fila de clientes para reativar" })
  @ApiQuery({ name: "days", required: false })
  queue(@Query("days") days?: string) {
    return this.getQueue.execute(days ? parseInt(days) : 30);
  }

  @Post("log")
  @ApiOperation({
    summary: "Registra que uma mensagem foi enviada a um cliente",
  })
  async log(
    @Body() body: { clientId: string; daysSince?: number; message: string },
  ) {
    return this.prisma.reactivationLog.create({
      data: {
        clientId: body.clientId,
        daysSince: body.daysSince ?? null,
        message: body.message,
      },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  @Get("history")
  @ApiOperation({ summary: "Histórico de mensagens de reativação enviadas" })
  @ApiQuery({ name: "limit", required: false })
  async history(@Query("limit") limit?: string) {
    const take = limit ? parseInt(limit) : 50;
    const rows = await this.prisma.reactivationLog.findMany({
      orderBy: { sentAt: "desc" },
      take,
      include: {
        client: { select: { id: true, name: true, phone: true } },
      },
    });
    return rows;
  }
}
