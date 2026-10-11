import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { MetricPoint } from './types';
import { MetricsCache } from './metrics-cache.interface';

@Injectable()
export class RedisCache implements MetricsCache, OnModuleInit {
  private readonly logger = new Logger(RedisCache.name);
  private client: RedisClientType | null = null;
  private fallback = new Map<string, MetricPoint[]>();
  private degraded = false;

  constructor(private cfg: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.cfg.get<string>('redisUrl');
    if (!url) return;
    try {
      this.client = createClient({ url }) as RedisClientType;
      this.client.on('error', (e: Error) => {
        if (!this.degraded) {
          this.degraded = true;
          this.logger.warn(`Redis unavailable, serving from memory: ${e.message}`);
        }
      });
      await this.client.connect();
      this.logger.log('Redis connected');
    } catch (e) {
      this.logger.warn(`Redis connect failed, using memory fallback: ${String(e)}`);
      this.client = null;
    }
  }

  private key(appId: string, dc: string): string {
    return `prodpulse:series:${appId}::${dc}`;
  }

  async setSeries(appId: string, dc: string, points: MetricPoint[]): Promise<void> {
    if (this.client?.isReady) {
      await this.client.set(this.key(appId, dc), JSON.stringify(points), { EX: 1800 });
      return;
    }
    this.fallback.set(`${appId}::${dc}`, points);
  }

  async getSeries(appId: string, dc: string): Promise<MetricPoint[]> {
    if (this.client?.isReady) {
      const raw = await this.client.get(this.key(appId, dc));
      return raw ? (JSON.parse(raw) as MetricPoint[]) : [];
    }
    return this.fallback.get(`${appId}::${dc}`) ?? [];
  }
}
