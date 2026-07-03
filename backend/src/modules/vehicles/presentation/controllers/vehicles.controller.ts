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
import { PrismaVehiclesRepository } from "../../infrastructure/repositories/prisma-vehicles.repository";
import { CreateVehicleDto } from "../../application/dtos/create-vehicle.dto";
import { UpdateVehicleDto } from "../../application/dtos/update-vehicle.dto";

@ApiTags("vehicles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly repo: PrismaVehiclesRepository) {}

  @Get()
  @ApiOperation({ summary: "Listar veículos" })
  @ApiQuery({ name: "clientId", required: false })
  findAll(@Query("clientId") clientId?: string) {
    return this.repo.findAll(clientId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar veículo por ID" })
  findOne(@Param("id") id: string) {
    return this.repo.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Cadastrar veículo" })
  create(@Body() dto: CreateVehicleDto) {
    return this.repo.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar veículo" })
  update(@Param("id") id: string, @Body() dto: UpdateVehicleDto) {
    return this.repo.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover veículo" })
  remove(@Param("id") id: string) {
    return this.repo.remove(id);
  }
}
