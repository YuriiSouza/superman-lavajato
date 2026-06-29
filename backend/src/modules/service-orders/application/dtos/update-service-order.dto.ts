import { PartialType } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { CreateServiceOrderDto } from './create-service-order.dto';

class PaymentEntryDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @ApiPropertyOptional({ type: [PaymentEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentEntryDto)
  payments?: PaymentEntryDto[];
}
