import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
