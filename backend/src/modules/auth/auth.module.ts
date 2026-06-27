import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { BcryptService } from './infrastructure/services/bcrypt.service';
import { JwtStrategy } from './presentation/strategies/jwt.strategy';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  providers: [LoginUseCase, LogoutUseCase, RefreshTokenUseCase, ChangePasswordUseCase, BcryptService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
