import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { JwtPayload } from '../../domain/entities/jwt-payload.type';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(refreshToken: string, res: any): Promise<{ accessToken: string }> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.hashedRefreshToken !== refreshToken) {
      throw new UnauthorizedException('Sessão expirada');
    }

    const newPayload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = this.jwtService.sign(newPayload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRATION', '15m'),
    });

    const secure = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, { httpOnly: true, secure, sameSite: secure ? 'none' : 'strict' });
    return { accessToken };
  }
}
