import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { PrismaClientsRepository } from '../../infrastructure/repositories/prisma-clients.repository';
import { CreateClientDto } from '../../application/dtos/create-client.dto';
import { UpdateClientDto } from '../../application/dtos/update-client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly repo: PrismaClientsRepository) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.repo.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.repo.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar cliente' })
  create(@Body() dto: CreateClientDto) {
    return this.repo.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.repo.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cliente' })
  remove(@Param('id') id: string) {
    return this.repo.remove(id);
  }
}
