import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async execute(userId: string, res: any): Promise<{ accessToken: string }> {
    const stored = await this.redis.get(`refresh:${userId}`);
    if (!stored) throw new UnauthorizedException('Sessão expirada');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRATION', '15m'),
    });

    res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'strict' });
    return { accessToken };
  }
}
