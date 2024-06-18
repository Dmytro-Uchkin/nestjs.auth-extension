import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import Redis from 'ioredis';
import redisConfig from './config/redis.config';
import { ConfigType } from '@nestjs/config';

export class InvalidatedRefreshTokenError extends Error {}

@Injectable()
export class RedisService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private redisClient: Redis;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly redisConfiguration: ConfigType<typeof redisConfig>,
  ) {}

  onApplicationBootstrap() {
    this.redisClient = new Redis({
      host: this.redisConfiguration.host,
      port: this.redisConfiguration.port,
    });
  }

  onApplicationShutdown() {
    this.redisClient.quit();
  }

  // TODO: Ideally, we should move this to the dedicated "RedisJWTModule"
  // instead of initiating the connection here.
  async insertToken(userId: number, token: string): Promise<void> {
    await this.redisClient.set(this.getKey(userId), token);
  }

  async validate(userId: number, token: string) {
    const storedToken = await this.redisClient.get(this.getKey(userId));

    if (storedToken !== token) {
      throw new InvalidatedRefreshTokenError();
    }

    return storedToken === token;
  }

  async invalidate(userId: number): Promise<void> {
    this.redisClient.del(this.getKey(userId));
  }

  private getKey(userId: number): string {
    return `user-${userId}`;
  }
}
