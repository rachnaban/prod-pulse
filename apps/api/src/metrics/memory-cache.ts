import { Injectable } from '@nestjs/common';
import { MetricPoint } from './types';
import { MetricsCache } from './metrics-cache.interface';

@Injectable()
export class MemoryCache implements MetricsCache {
  private series = new Map<string, MetricPoint[]>();

  private key(appId: string, dc: string): string {
    return `${appId}::${dc}`;
  }

  async setSeries(appId: string, dc: string, points: MetricPoint[]): Promise<void> {
    this.series.set(this.key(appId, dc), points);
  }

  async getSeries(appId: string, dc: string): Promise<MetricPoint[]> {
    return this.series.get(this.key(appId, dc)) ?? [];
  }
}
