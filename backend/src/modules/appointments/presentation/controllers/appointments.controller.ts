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
import { PrismaAppointmentsRepository } from "../../infrastructure/repositories/prisma-appointments.repository";
import { CreateAppointmentDto } from "../../application/dtos/create-appointment.dto";
import { UpdateAppointmentDto } from "../../application/dtos/update-appointment.dto";

@ApiTags("appointments")
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly repo: PrismaAppointmentsRepository) {}

  /** Slots disponíveis — público, usado pela página de agendamento */
  @Get("slots")
  @ApiOperation({ summary: "Horários disponíveis para uma data e serviço" })
  @ApiQuery({ name: "date", required: true })
  @ApiQuery({ name: "serviceId", required: true })
  getSlots(@Query("date") date: string, @Query("serviceId") serviceId: string) {
    return this.repo.getAvailableSlots(date, serviceId);
  }

  /** Criar agendamento — público */
  @Post()
  @ApiOperation({ summary: "Criar agendamento (público)" })
  create(@Body() dto: CreateAppointmentDto) {
    return this.repo.create(dto);
  }

  /** Lista por data — protegido */
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Listar agendamentos por data" })
  @ApiQuery({ name: "date", required: true })
  findByDate(@Query("date") date: string) {
    return this.repo.findByDate(date);
  }

  /** Buscar um — protegido */
  @Get(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Buscar agendamento" })
  findOne(@Param("id") id: string) {
    return this.repo.findById(id);
  }

  /** Atualizar status — protegido */
  @Put(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Atualizar status do agendamento" })
  update(@Param("id") id: string, @Body() dto: UpdateAppointmentDto) {
    return this.repo.update(id, dto);
  }

  /** Cancelar/remover — protegido */
  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Remover agendamento" })
  remove(@Param("id") id: string) {
    return this.repo.remove(id);
  }
}
