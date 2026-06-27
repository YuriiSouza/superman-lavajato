import { Body, Controller, Get, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { LoginDto } from '../../application/dtos/login.dto';
import { ChangePasswordDto } from '../../application/dtos/change-password.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly logout: LogoutUseCase,
    private readonly refresh: RefreshTokenUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login com email e senha' })
  async loginHandler(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.login.execute(dto, res);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renovar access token' })
  async refreshHandler(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    return this.refresh.execute(user.id, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout' })
  async logoutHandler(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.logout.execute(user.id, res);
    return { message: 'Logout realizado com sucesso' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  async me(@CurrentUser() user: any) {
    return user;
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar senha' })
  async changePasswordHandler(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    await this.changePassword.execute(user.id, dto);
    return { message: 'Senha alterada com sucesso.' };
  }
}
