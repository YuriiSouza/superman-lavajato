import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/presentation/guards/jwt-auth.guard";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

@ApiTags("cash")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("cash")
export class CashController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private invalidateCashCache() {
    return this.cache.del("cash:today");
  }

  @Get("today")
  @ApiOperation({ summary: "Situação do caixa de hoje" })
  async today() {
    const cached = await this.cache.get("cash:today");
    if (cached) return cached;

    const session = await this.prisma.cashSession.findUnique({
      where: { date: todayStr() },
      include: { outflows: { orderBy: { createdAt: "asc" } } },
    });

    const { start, end } = todayRange();

    // OS pagas hoje: via order_payments OU via paymentMethod legado (updatedAt hoje)
    const paidToday = await this.prisma.orderPayment.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { serviceOrderId: true },
      distinct: ["serviceOrderId"],
    });
    const paidIds = paidToday.map((p) => p.serviceOrderId);

    const orders = await this.prisma.serviceOrder.findMany({
      where: {
        status: "PAGO",
        OR: [
          ...(paidIds.length ? [{ id: { in: paidIds } }] : []),
          { updatedAt: { gte: start, lte: end } },
        ],
      },
      include: {
        client: { select: { name: true } },
        vehicle: { select: { plate: true, model: true } },
        service: { select: { name: true } },
        payments: true,
      },
      orderBy: { updatedAt: "asc" },
    });

    // Totais por forma de pagamento
    // — usa order_payments quando existem, cai em paymentMethod legacy se não existem
    const byPayment: Record<string, number> = {};
    let totalRevenue = 0;

    for (const o of orders) {
      const value = Number(o.totalValue);
      totalRevenue += value;

      if ((o as any).payments?.length) {
        for (const p of (o as any).payments) {
          byPayment[p.method] = (byPayment[p.method] ?? 0) + Number(p.amount);
        }
      } else if (o.paymentMethod) {
        byPayment[o.paymentMethod] = (byPayment[o.paymentMethod] ?? 0) + value;
      }
    }

    const cashReceived = byPayment["DINHEIRO"] ?? 0;
    const digitalReceived = totalRevenue - cashReceived;
    const cashOutflows = session
      ? session.outflows
          .filter((f) => f.source !== "DIGITAL")
          .reduce((s, f) => s + Number(f.amount), 0)
      : 0;
    const digitalOutflows = session
      ? session.outflows
          .filter((f) => f.source === "DIGITAL")
          .reduce((s, f) => s + Number(f.amount), 0)
      : 0;
    const outflowsTotal = cashOutflows + digitalOutflows;
    const openingBalance = session ? Number(session.openingBalance) : 0;
    const digitalOpeningBalance = session
      ? Number(session.digitalOpeningBalance)
      : 0;
    const cashInDrawer = openingBalance + cashReceived - cashOutflows;
    const digitalBalance =
      digitalOpeningBalance + digitalReceived - digitalOutflows;

    let difference: number | null = null;
    if (session?.closedAt && session.physicalCount != null) {
      difference = Number(session.physicalCount) - cashInDrawer;
    }

    const result = {
      session,
      revenue: {
        total: totalRevenue,
        byPayment,
        ordersCount: orders.length,
        orders,
      },
      cashReceived,
      digitalReceived,
      digitalOpeningBalance,
      digitalBalance,
      cashOutflows,
      digitalOutflows,
      outflowsTotal,
      cashInDrawer,
      difference,
    };

    // Cache de 15s — invalidado em abertura, fechamento e saídas
    await this.cache.set("cash:today", result, 15_000);
    return result;
  }

  @Get("suggested-opening")
  @ApiOperation({
    summary: "Saldos sugeridos para abertura baseados no último dia",
  })
  async suggestedOpening() {
    const tz = "America/Sao_Paulo";
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: tz });

    const lastSession = await this.prisma.cashSession.findFirst({
      where: { date: { lt: today } },
      include: { outflows: true },
      orderBy: { date: "desc" },
    });

    if (!lastSession) return { cash: 0, digital: 0 };

    // Receita do último dia via order_payments
    const start = new Date(lastSession.date + "T00:00:00");
    const end = new Date(lastSession.date + "T23:59:59.999");

    const payments = await this.prisma.orderPayment.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { method: true, amount: true },
    });

    const cashReceived = payments
      .filter((p) => p.method === "DINHEIRO")
      .reduce((s, p) => s + Number(p.amount), 0);
    const digitalReceived = payments
      .filter((p) => p.method !== "DINHEIRO")
      .reduce((s, p) => s + Number(p.amount), 0);

    const cashOutflows = lastSession.outflows
      .filter((f) => f.source !== "DIGITAL")
      .reduce((s, f) => s + Number(f.amount), 0);
    const digitalOutflows = lastSession.outflows
      .filter((f) => f.source === "DIGITAL")
      .reduce((s, f) => s + Number(f.amount), 0);

    const cashInDrawer =
      Number(lastSession.openingBalance) + cashReceived - cashOutflows;
    const digitalBalance =
      Number(lastSession.digitalOpeningBalance) +
      digitalReceived -
      digitalOutflows;

    const suggestedCash =
      lastSession.closedAt && lastSession.physicalCount != null
        ? Number(lastSession.physicalCount)
        : cashInDrawer;

    return {
      cash: Math.round(Math.max(0, suggestedCash) * 100) / 100,
      digital: Math.round(Math.max(0, digitalBalance) * 100) / 100,
    };
  }

  @Post("open")
  @ApiOperation({ summary: "Abre o caixa do dia" })
  async open(
    @Body()
    body: {
      openingBalance: number;
      digitalOpeningBalance?: number;
      operatorName: string;
    },
  ) {
    const result = await this.prisma.cashSession.create({
      data: {
        date: todayStr(),
        openingBalance: body.openingBalance ?? 0,
        digitalOpeningBalance: body.digitalOpeningBalance ?? 0,
        operatorName: body.operatorName,
      },
      include: { outflows: true },
    });
    await this.invalidateCashCache();
    return result;
  }

  @Post("close")
  @ApiOperation({ summary: "Fecha o caixa do dia com contagem física" })
  async close(@Body() body: { physicalCount: number }) {
    const session = await this.prisma.cashSession.findUnique({
      where: { date: todayStr() },
    });
    if (!session) throw new Error("Nenhum caixa aberto hoje.");
    const result = await this.prisma.cashSession.update({
      where: { id: session.id },
      data: { closedAt: new Date(), physicalCount: body.physicalCount },
      include: { outflows: true },
    });
    await this.invalidateCashCache();
    return result;
  }

  @Get("history")
  @ApiOperation({ summary: "Histórico de caixas com receita por dia" })
  async history(@Query("days") days = "60") {
    const n = parseInt(days);
    const tz = "America/Sao_Paulo";

    const since = new Date();
    since.setDate(since.getDate() - n + 1);
    since.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.cashSession.findMany({
      where: { openedAt: { gte: since } },
      include: { outflows: true },
      orderBy: { date: "desc" },
    });

    // OS pagas no período: via order_payments OU via updatedAt (legado)
    const paidInPeriod = await this.prisma.orderPayment.findMany({
      where: { createdAt: { gte: since } },
      select: { serviceOrderId: true },
      distinct: ["serviceOrderId"],
    });
    const paidIds = paidInPeriod.map((p) => p.serviceOrderId);

    const orders = await this.prisma.serviceOrder.findMany({
      where: {
        status: "PAGO",
        OR: [
          ...(paidIds.length ? [{ id: { in: paidIds } }] : []),
          { updatedAt: { gte: since } },
        ],
      },
      include: { payments: true },
    });

    // Agrupa por data de pagamento (no fuso BR)
    const revenueMap = new Map<
      string,
      { revenue: number; ordersCount: number; cash: number; digital: number }
    >();

    for (const order of orders) {
      const payments = (order as any).payments ?? [];
      let payDate: string;
      if (payments.length > 0) {
        const earliest = payments.reduce((min: any, p: any) =>
          new Date(p.createdAt) < new Date(min.createdAt) ? p : min,
        );
        payDate = new Date(earliest.createdAt).toLocaleDateString("sv-SE", {
          timeZone: tz,
        });
      } else {
        payDate = new Date(order.updatedAt).toLocaleDateString("sv-SE", {
          timeZone: tz,
        });
      }

      if (!revenueMap.has(payDate))
        revenueMap.set(payDate, {
          revenue: 0,
          ordersCount: 0,
          cash: 0,
          digital: 0,
        });

      const day = revenueMap.get(payDate)!;
      day.revenue += Number(order.totalValue);
      day.ordersCount += 1;

      if (payments.length > 0) {
        for (const p of payments) {
          if (p.method === "DINHEIRO") day.cash += Number(p.amount);
          else day.digital += Number(p.amount);
        }
      } else if (order.paymentMethod) {
        if (order.paymentMethod === "DINHEIRO")
          day.cash += Number(order.totalValue);
        else day.digital += Number(order.totalValue);
      }
    }

    const result = [];
    for (let i = 0; i < n; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("sv-SE", { timeZone: tz });
      const session = sessions.find((s) => s.date === dateStr) ?? null;
      const rev = revenueMap.get(dateStr) ?? {
        revenue: 0,
        ordersCount: 0,
        cash: 0,
        digital: 0,
      };
      const cashOutflowsDay = session
        ? session.outflows
            .filter((f) => f.source !== "DIGITAL")
            .reduce((s, f) => s + Number(f.amount), 0)
        : 0;
      const digitalOutflowsDay = session
        ? session.outflows
            .filter((f) => f.source === "DIGITAL")
            .reduce((s, f) => s + Number(f.amount), 0)
        : 0;
      const outflowsTotal = cashOutflowsDay + digitalOutflowsDay;
      const openingBalance = session ? Number(session.openingBalance) : 0;
      const cashInDrawer = openingBalance + rev.cash - cashOutflowsDay;
      const difference =
        session?.closedAt && session.physicalCount != null
          ? Number(session.physicalCount) - cashInDrawer
          : null;

      result.push({
        date: dateStr,
        session: session
          ? {
              id: session.id,
              openedAt: session.openedAt,
              closedAt: session.closedAt,
              operatorName: session.operatorName,
              openingBalance: Number(session.openingBalance),
              physicalCount: session.physicalCount
                ? Number(session.physicalCount)
                : null,
              outflows: session.outflows,
            }
          : null,
        revenue: rev.revenue,
        cashIn: rev.cash,
        digital: rev.digital,
        ordersCount: rev.ordersCount,
        outflowsTotal,
        cashInDrawer,
        difference,
      });
    }

    const totals = result.reduce(
      (acc, d) => ({
        revenue: acc.revenue + d.revenue,
        orders: acc.orders + d.ordersCount,
        outflows: acc.outflows + d.outflowsTotal,
        daysWithSession: acc.daysWithSession + (d.session ? 1 : 0),
        daysWithDiff:
          acc.daysWithDiff +
          (d.difference !== null && Math.abs(d.difference) >= 0.01 ? 1 : 0),
      }),
      {
        revenue: 0,
        orders: 0,
        outflows: 0,
        daysWithSession: 0,
        daysWithDiff: 0,
      },
    );

    return { days: result, totals };
  }

  @Get("pending-close")
  @ApiOperation({ summary: "Retorna sessões de dias anteriores ainda abertas" })
  async pendingClose() {
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "America/Sao_Paulo",
    });
    return this.prisma.cashSession.findMany({
      where: { closedAt: null, date: { lt: today } },
      include: { outflows: true },
      orderBy: { date: "desc" },
    });
  }

  @Post("close/:id")
  @ApiOperation({ summary: "Fecha uma sessão específica por ID" })
  async closeById(
    @Param("id") id: string,
    @Body() body: { physicalCount: number },
  ) {
    const result = await this.prisma.cashSession.update({
      where: { id },
      data: { closedAt: new Date(), physicalCount: body.physicalCount },
      include: { outflows: true },
    });
    await this.invalidateCashCache();
    return result;
  }

  @Post("reopen")
  @ApiOperation({ summary: "Reabre o caixa fechado do dia" })
  async reopen() {
    const session = await this.prisma.cashSession.findUnique({
      where: { date: todayStr() },
    });
    if (!session) throw new Error("Nenhum caixa registrado hoje.");
    if (!session.closedAt) throw new Error("Caixa já está aberto.");
    const result = await this.prisma.cashSession.update({
      where: { id: session.id },
      data: { closedAt: null, physicalCount: null },
      include: { outflows: true },
    });
    await this.invalidateCashCache();
    return result;
  }

  @Post("outflow")
  @ApiOperation({ summary: "Registra uma saída/sangria no caixa" })
  async outflow(
    @Body()
    body: {
      type?: string;
      amount?: number;
      reason?: string;
      category?: string;
      supplier?: string;
      source?: string;
      billId?: string;
      productId?: string;
      quantity?: number;
    },
  ) {
    const session = await this.prisma.cashSession.findUnique({
      where: { date: todayStr() },
    });
    if (!session || session.closedAt) throw new Error("Caixa não está aberto.");
    const src = body.source === "DIGITAL" ? "DIGITAL" : "FISICO";

    let result: any;

    if (body.type === "RESERVE" && body.billId) {
      const bill = await this.prisma.bill.findUnique({
        where: { id: body.billId },
      });
      if (!bill) throw new Error("Conta não encontrada.");
      const amount = body.amount ?? 0;
      await this.prisma.$transaction([
        this.prisma.cashOutflow.create({
          data: {
            sessionId: session.id,
            amount,
            reason: `Reserva: ${bill.name}`,
            category: bill.category as any,
            source: src,
          },
        }),
        this.prisma.financialReserve.create({
          data: {
            billId: body.billId,
            amount,
            description: body.reason ?? undefined,
          },
        }),
      ]);
      result = { ok: true, type: "RESERVE" };
    } else if (body.type === "BILL" && body.billId) {
      const bill = await this.prisma.bill.findUnique({
        where: { id: body.billId },
      });
      if (!bill) throw new Error("Conta não encontrada.");
      const amount = body.amount != null ? body.amount : Number(bill.amount);
      await this.prisma.$transaction([
        this.prisma.cashOutflow.create({
          data: {
            sessionId: session.id,
            amount,
            reason: bill.name,
            category: bill.category as any,
            source: src,
          },
        }),
        this.prisma.bill.update({
          where: { id: body.billId },
          data: { status: "PAGO", paidAt: new Date() },
        }),
      ]);
      result = { ok: true, type: "BILL" };
    } else if (body.type === "PRODUCT" && body.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: body.productId },
      });
      if (!product) throw new Error("Produto não encontrado.");
      const amount = body.amount ?? 0;
      const qty = body.quantity ?? 1;
      const unitCost =
        qty > 0 ? Math.round((amount / qty) * 100) / 100 : undefined;
      await this.prisma.$transaction([
        this.prisma.cashOutflow.create({
          data: {
            sessionId: session.id,
            amount,
            reason: product.name,
            category: "PRODUTO",
            supplier: body.supplier,
            source: src,
          },
        }),
        this.prisma.stockEntry.create({
          data: {
            productId: body.productId,
            quantity: qty,
            costPrice: unitCost,
            supplier: body.supplier,
          },
        }),
        this.prisma.product.update({
          where: { id: body.productId },
          data: {
            quantity: { increment: qty },
            ...(unitCost ? { costPrice: unitCost } : {}),
          },
        }),
      ]);
      result = { ok: true, type: "PRODUCT" };
    } else {
      result = await this.prisma.cashOutflow.create({
        data: {
          sessionId: session.id,
          amount: body.amount,
          reason: body.reason,
          category: (body.category as any) ?? "OUTRO",
          source: src,
          supplier: body.supplier,
        },
      });
    }

    await this.invalidateCashCache();
    return result;
  }
}
