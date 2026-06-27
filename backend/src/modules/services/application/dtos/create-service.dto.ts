import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Lavagem Completa' })
  @IsString()
  name: string;

  @ApiProperty({ example: 80 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 60, description: 'Duração em minutos' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
