import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  plate: string;

  @ApiProperty({ example: 'HB20' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ example: 'Prata' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ enum: VehicleType, default: VehicleType.SEDAN })
  @IsEnum(VehicleType)
  @IsOptional()
  type?: VehicleType;

  @ApiProperty()
  @IsUUID()
  clientId: string;
}
