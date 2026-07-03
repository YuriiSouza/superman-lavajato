import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { GetFinancialUseCase } from '../../application/use-cases/get-financial.use-case';

@ApiTags('financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly getFinancial: GetFinancialUseCase) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro por período ou intervalo de datas' })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  @ApiQuery({ name: 'serviceId', required: false })
  summary(
    @Query('period') period?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.getFinancial.summary({ period, start, end, serviceId });
  }

  @Get('progression')
  @ApiOperation({ summary: 'Faturamento diário (período ou N dias)' })
  @ApiQuery({ name: 'days', required: false })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  @ApiQuery({ name: 'serviceId', required: false })
  progression(
    @Query('days') days?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.getFinancial.dailyRevenue({
      days: days ? parseInt(days, 10) : undefined,
      start,
      end,
      serviceId,
    });
  }

  @Get('revenue-by-service-by-day')
  @ApiOperation({ summary: 'Receita por serviço por dia' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  revenueByServiceByDay(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.getFinancial.revenueByServiceByDay({ start, end });
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Mapa de calor: OS por hora e dia da semana' })
  @ApiQuery({ name: 'days', required: false })
  heatmap(@Query('days') days = '90') {
    return this.getFinancial.heatmap(parseInt(days, 10));
  }

  @Get('by-vehicle-type')
  @ApiOperation({ summary: 'OS e receita por tipo de veículo' })
  @ApiQuery({ name: 'days', required: false })
  byVehicleType(@Query('days') days = '90') {
    return this.getFinancial.byVehicleType(parseInt(days, 10));
  }

  @Get('profit')
  @ApiOperation({ summary: 'Lucro líquido real para um período (receita − despesas − CMV)' })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  profit(
    @Query('period') period?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.getFinancial.profit({ period, start, end });
  }

  @Get('dre')
  @ApiOperation({ summary: 'DRE: Receita, Despesas, CMV e Lucro Líquido por mês' })
  @ApiQuery({ name: 'months', required: false })
  dre(@Query('months') months = '6') {
    return this.getFinancial.dre(parseInt(months, 10));
  }

  @Get('reserves')
  @ApiOperation({ summary: 'Listar reservas agrupadas por conta' })
  listReserves() {
    return this.getFinancial.listReservesGrouped();
  }

  @Get('reserves/summary')
  @ApiOperation({ summary: 'Total reservado' })
  reserveSummary() {
    return this.getFinancial.reserveSummary();
  }

  @Post('reserves')
  @ApiOperation({ summary: 'Adicionar contribuição a uma reserva por conta' })
  createReserve(@Body() body: { billId: string; amount: number; description?: string }) {
    return this.getFinancial.createReserve(body);
  }

  @Delete('reserves/:id')
  @ApiOperation({ summary: 'Remover contribuição de reserva' })
  deleteReserve(@Param('id') id: string) {
    return this.getFinancial.deleteReserve(id);
  }
}
