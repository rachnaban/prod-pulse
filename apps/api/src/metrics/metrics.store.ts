import { Inject, Injectable } from '@nestjs/common';
import { MetricPoint, Band, DcHealth, Slo } from './types';
import { METRICS_CACHE, MetricsCache } from './metrics-cache.interface';

@Injectable()
export class MetricsStore {
  constructor(@Inject(METRICS_CACHE) private cache: MetricsCache) {}

  async setSeries(appId: string, dc: string, points: MetricPoint[]): Promise<void> {
    await this.cache.setSeries(appId, dc, points);
  }

  async getSeries(appId: string, dc: string): Promise<MetricPoint[]> {
    return this.cache.getSeries(appId, dc);
  }

  async latest(appId: string, dc: string): Promise<MetricPoint | undefined> {
    const s = await this.cache.getSeries(appId, dc);
    return s.length > 0 ? s[s.length - 1] : undefined;
  }

  async dcHealth(
    appId: string,
    dc: string,
    slo: Slo,
    compute: (p: MetricPoint, slo: Slo) => { score: number; band: Band },
  ): Promise<DcHealth | null> {
    const latest = await this.latest(appId, dc);
    if (!latest) return null;
    const { score, band: b } = compute(latest, slo);
    return {
      dc,
      score,
      band: b,
      rpm: latest.rpm,
      p95Ms: latest.p95Ms,
      errorRatePct: latest.errorRatePct,
      availabilityPct: latest.availabilityPct,
      stale: Date.now() - latest.t > 15 * 60 * 1000,
    };
  }
}
