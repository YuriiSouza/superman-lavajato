import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Lê um setting pelo key (público)' })
  async get(@Param('key') key: string) {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return { key, value: row?.value ?? null };
  }

  @Put(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Salva/atualiza um setting' })
  async upsert(@Param('key') key: string, @Body() body: { value: string }) {
    const row = await this.prisma.setting.upsert({
      where: { key },
      update: { value: body.value },
      create: { key, value: body.value },
    });
    return { key: row.key, value: row.value };
  }
}
