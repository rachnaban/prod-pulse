import { MetricPoint } from './types';

export const METRICS_CACHE = 'METRICS_CACHE';

export interface MetricsCache {
  setSeries(appId: string, dc: string, points: MetricPoint[]): Promise<void>;
  getSeries(appId: string, dc: string): Promise<MetricPoint[]>;
}
