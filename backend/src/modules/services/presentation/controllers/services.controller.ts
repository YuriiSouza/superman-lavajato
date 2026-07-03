import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { PrismaServicesRepository } from '../../infrastructure/repositories/prisma-services.repository';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateServiceDto } from '../../application/dtos/create-service.dto';
import { UpdateServiceDto } from '../../application/dtos/update-service.dto';

class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsBoolean() requiresVehicle?: boolean;
}

class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() requiresVehicle?: boolean;
  @IsOptional() @IsBoolean() active?: boolean;
}

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly repo: PrismaServicesRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Categories ──────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias de serviço' })
  listCategories() {
    return this.prisma.serviceCategory.findMany({ orderBy: { name: 'asc' } });
  }

  @Post('categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar categoria de serviço' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: { name: dto.name, requiresVehicle: dto.requiresVehicle ?? true },
    });
  }

  @Put('categories/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar categoria de serviço' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.prisma.serviceCategory.update({ where: { id }, data: dto });
  }

  @Delete('categories/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remover categoria de serviço' })
  removeCategory(@Param('id') id: string) {
    return this.prisma.serviceCategory.delete({ where: { id } });
  }

  // ── Services ─────────────────────────────────────────────────

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
