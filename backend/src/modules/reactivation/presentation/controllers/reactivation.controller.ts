import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { GetReactivationQueueUseCase } from '../../application/use-cases/get-reactivation-queue.use-case';

@ApiTags('reactivation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reactivation')
export class ReactivationController {
  constructor(private readonly getQueue: GetReactivationQueueUseCase) {}

  @Get('queue')
  @ApiOperation({ summary: 'Fila de clientes para reativar' })
  @ApiQuery({ name: 'days', required: false, description: 'Dias sem visita (padrão: 30)' })
  queue(@Query('days') days?: string) {
    return this.getQueue.execute(days ? parseInt(days) : 30);
  }
}
