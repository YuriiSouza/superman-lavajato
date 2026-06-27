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
  @ApiOperation({ summary: 'Resumo financeiro por período' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'], required: false })
  summary(@Query('period') period: 'day' | 'week' | 'month' = 'day') {
    return this.getFinancial.summary(period);
  }
}
