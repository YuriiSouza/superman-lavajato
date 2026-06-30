import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Lavagem Completa' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Interna e externa para um carro impecável.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 80 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 60, description: 'Duração em minutos' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ example: ['Aspiração interna', 'Limpeza de vidros'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  highlight?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
