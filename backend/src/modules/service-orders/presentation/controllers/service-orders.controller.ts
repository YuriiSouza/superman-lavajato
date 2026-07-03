import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/presentation/guards/jwt-auth.guard";
import { PrismaServiceOrdersRepository } from "../../infrastructure/repositories/prisma-service-orders.repository";
import { CreateServiceOrderDto } from "../../application/dtos/create-service-order.dto";
import { UpdateServiceOrderDto } from "../../application/dtos/update-service-order.dto";

@ApiTags("service-orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("service-orders")
export class ServiceOrdersController {
  constructor(private readonly repo: PrismaServiceOrdersRepository) {}

  @Get()
  @ApiOperation({ summary: "Listar ordens de serviço" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "date", required: false, description: "YYYY-MM-DD" })
  findAll(@Query("status") status?: string, @Query("date") date?: string) {
    return this.repo.findAll({ status, date });
  }

  @Get("today")
  @ApiOperation({ summary: "Ordens de hoje" })
  findToday() {
    return this.repo.findToday();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar ordem por ID" })
  findOne(@Param("id") id: string) {
    return this.repo.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Criar ordem de serviço" })
  create(@Body() dto: CreateServiceOrderDto) {
    return this.repo.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar ordem" })
  update(@Param("id") id: string, @Body() dto: UpdateServiceOrderDto) {
    return this.repo.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancelar ordem" })
  remove(@Param("id") id: string) {
    return this.repo.remove(id);
  }
}
