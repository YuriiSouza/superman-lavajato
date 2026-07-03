import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, Matches } from "class-validator";

export class CreateAppointmentDto {
  @ApiProperty({ example: "João Silva" })
  @IsString()
  clientName: string;

  @ApiProperty({ example: "62981891074" })
  @IsString()
  clientPhone: string;

  @ApiProperty({ example: "Onix Prata 2022" })
  @IsString()
  vehicle: string;

  @ApiProperty({ example: "uuid-do-servico" })
  @IsString()
  serviceId: string;

  @ApiProperty({ example: "2026-07-15" })
  @IsDateString()
  date: string;

  @ApiProperty({ example: "09:00" })
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
