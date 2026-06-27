import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { GetSegmentsUseCase } from '../../application/use-cases/get-segments.use-case';

@ApiTags('segments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('segments')
export class SegmentsController {
  constructor(private readonly getSegments: GetSegmentsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Segmentação de clientes' })
  get() {
    return this.getSegments.execute();
  }
}
