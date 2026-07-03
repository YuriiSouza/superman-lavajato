import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/presentation/guards/jwt-auth.guard";
import { GetDashboardUseCase } from "../../application/use-cases/get-dashboard.use-case";

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly getDashboard: GetDashboardUseCase) {}

  @Get()
  @ApiOperation({ summary: "Métricas do dashboard" })
  get() {
    return this.getDashboard.execute();
  }
}
