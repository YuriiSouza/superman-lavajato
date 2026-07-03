import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { PaymentMethod, OrderStatus } from "@prisma/client";

export class CreateServiceOrderDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  addons?: any;

  @ApiProperty({ example: 80 })
  @IsNumber()
  @Min(0)
  totalValue: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: OrderStatus, default: OrderStatus.PENDENTE })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
