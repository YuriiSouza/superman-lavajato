import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { PrismaServicesRepository } from '../../infrastructure/repositories/prisma-services.repository';
import { CreateServiceDto } from '../../application/dtos/create-service.dto';
import { UpdateServiceDto } from '../../application/dtos/update-service.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly repo: PrismaServicesRepository) {}

  @Get()
  @ApiOperation({ summary: 'Listar serviços (público)' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.repo.findAll(activeOnly === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar serviço (público)' })
  findOne(@Param('id') id: string) {
    return this.repo.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar serviço' })
  create(@Body() dto: CreateServiceDto) {
    return this.repo.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar serviço' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.repo.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remover serviço' })
  remove(@Param('id') id: string) {
    return this.repo.remove(id);
  }
}
