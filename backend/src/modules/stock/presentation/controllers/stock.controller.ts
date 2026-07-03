import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

class CreateProductDto {
  @IsString() name: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Type(() => Number) minQuantity?: number;
  @IsOptional() @IsNumber() @Type(() => Number) costPrice?: number;
}

class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Type(() => Number) minQuantity?: number;
  @IsOptional() @IsNumber() @Type(() => Number) costPrice?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

class StockEntryDto {
  @IsNumber() @Min(0.001) @Type(() => Number) quantity: number;
  @IsOptional() @IsNumber() @Type(() => Number) costPrice?: number;
  @IsOptional() @IsString() supplier?: string;
  @IsOptional() @IsString() notes?: string;
}

class ProductUsageDto {
  @IsString() serviceOrderId: string;
  @IsString() productId: string;
  @IsNumber() @Min(0.001) @Type(() => Number) quantity: number;
}

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('products')
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiQuery({ name: 'activeOnly', required: false })
  async listProducts(@Query('activeOnly') activeOnly?: string) {
    return this.prisma.product.findMany({
      where: activeOnly === 'true' ? { active: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  @Post('products')
  @ApiOperation({ summary: 'Criar produto' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        unit: dto.unit ?? 'unidade',
        minQuantity: dto.minQuantity ?? 0,
        costPrice: dto.costPrice,
      },
    });
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Atualizar produto' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Remover produto' })
  async deleteProduct(@Param('id') id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  @Post('products/:id/entries')
  @ApiOperation({ summary: 'Registrar entrada de estoque' })
  async addEntry(@Param('id') productId: string, @Body() dto: StockEntryDto) {
    const [entry] = await this.prisma.$transaction([
      this.prisma.stockEntry.create({
        data: { productId, quantity: dto.quantity, costPrice: dto.costPrice, supplier: dto.supplier, notes: dto.notes },
      }),
      this.prisma.product.update({
        where: { id: productId },
        data: { quantity: { increment: dto.quantity }, ...(dto.costPrice ? { costPrice: dto.costPrice } : {}) },
      }),
    ]);
    return entry;
  }

  @Get('products/:id/history')
  @ApiOperation({ summary: 'Histórico de entradas e usos do produto' })
  async productHistory(@Param('id') productId: string) {
    const [entries, usages] = await Promise.all([
      this.prisma.stockEntry.findMany({ where: { productId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.productUsage.findMany({
        where: { productId },
        include: { serviceOrder: { select: { id: true, createdAt: true, client: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);
    return { entries, usages };
  }

  @Post('usages')
  @ApiOperation({ summary: 'Registrar uso de produto em OS' })
  async addUsage(@Body() dto: ProductUsageDto) {
    const [usage] = await this.prisma.$transaction([
      this.prisma.productUsage.create({
        data: { serviceOrderId: dto.serviceOrderId, productId: dto.productId, quantity: dto.quantity },
        include: { product: true },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { quantity: { decrement: dto.quantity } },
      }),
    ]);
    return usage;
  }

  @Post('count')
  @ApiOperation({ summary: 'Registra contagem periódica do estoque' })
  async submitCount(@Body() body: { items: { productId: string; quantity: number }[]; notes?: string }) {
    await this.prisma.$transaction(async (tx) => {
      for (const item of body.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId }, select: { costPrice: true } });
        await tx.stockCount.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            costPrice: product?.costPrice ?? null,
            notes: body.notes ?? null,
          },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: item.quantity },
        });
      }
    });
    return { ok: true, count: body.items.length };
  }

  @Get('counts')
  @ApiOperation({ summary: 'Histórico de contagens de estoque' })
  async listCounts(@Query('limit') limit = '30') {
    const counts = await this.prisma.stockCount.findMany({
      orderBy: { countedAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true, quantity: true, costPrice: true, notes: true, countedAt: true,
        product: { select: { id: true, name: true, unit: true } },
      },
    });
    // Group by countedAt (same-second batches = same submission)
    const groups: Record<string, any[]> = {};
    for (const c of counts) {
      const key = new Date(c.countedAt).toISOString().slice(0, 19);
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }
    return Object.entries(groups)
      .map(([ts, items]) => ({ countedAt: ts + 'Z', items }))
      .slice(0, 20);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Produtos abaixo do estoque mínimo' })
  async stockAlerts() {
    const products = await this.prisma.product.findMany({ where: { active: true } });
    return products.filter((p) => Number(p.quantity) <= Number(p.minQuantity));
  }

  @Get('intelligence')
  @ApiOperation({ summary: 'Previsão de esgotamento e saúde do estoque por produto' })
  async intelligence() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [products, allCounts, entries30] = await Promise.all([
      this.prisma.product.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      this.prisma.stockCount.findMany({
        orderBy: { countedAt: 'desc' },
        select: { productId: true, quantity: true, countedAt: true },
      }),
      this.prisma.stockEntry.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { productId: true, quantity: true },
      }),
    ]);

    const today = new Date();

    return products.map((p) => {
      const productCounts = allCounts.filter((c) => c.productId === p.id);
      const currentQty = Number(p.quantity);

      // Consumo = (contagem 30d atrás ou mais antiga) + compras30d - quantidade atual
      const openingCount = productCounts.find((c) => new Date(c.countedAt) <= thirtyDaysAgo);
      const purchases30 = entries30
        .filter((e) => e.productId === p.id)
        .reduce((s, e) => s + Number(e.quantity), 0);

      let totalUsed30 = 0;
      if (openingCount) {
        totalUsed30 = Math.max(0, Number(openingCount.quantity) + purchases30 - currentQty);
      }

      const avgDailyUsage = Math.round((totalUsed30 / 30) * 1000) / 1000;

      let estimatedDaysLeft: number | null = null;
      let estimatedStockoutDate: string | null = null;

      if (avgDailyUsage > 0) {
        estimatedDaysLeft = Math.floor(currentQty / avgDailyUsage);
        const stockoutDate = new Date(today);
        stockoutDate.setDate(today.getDate() + estimatedDaysLeft);
        estimatedStockoutDate = stockoutDate.toISOString().split('T')[0];
      }

      const lastCount = productCounts[0] ?? null;

      return {
        id: p.id,
        name: p.name,
        unit: p.unit,
        quantity: currentQty,
        minQuantity: Number(p.minQuantity),
        costPrice: p.costPrice ? Number(p.costPrice) : null,
        avgDailyUsage,
        totalUsed30: Math.round(totalUsed30 * 1000) / 1000,
        estimatedDaysLeft,
        estimatedStockoutDate,
        lastCountedAt: lastCount?.countedAt ?? null,
        lowStockSoon: estimatedDaysLeft !== null && estimatedDaysLeft <= 7,
        belowMin: currentQty <= Number(p.minQuantity),
      };
    });
  }
}
