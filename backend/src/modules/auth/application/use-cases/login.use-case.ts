import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';
import { LoginDto } from '../dtos/login.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly bcrypt: BcryptService,
  ) {}

  async execute(dto: LoginDto, res: any): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await this.bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const payload = { sub: user.id, email: user.email, name: user.name };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRATION', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

    await this.redis.set(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'strict' });
    res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'strict' });

    return { accessToken, user: { id: user.id, email: user.email, name: user.name } };
  }
}
