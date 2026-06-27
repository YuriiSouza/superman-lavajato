import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../../infrastructure/redis/redis.service';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly redis: RedisService) {}

  async execute(userId: string, res: any): Promise<void> {
    await this.redis.del(`refresh:${userId}`);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
