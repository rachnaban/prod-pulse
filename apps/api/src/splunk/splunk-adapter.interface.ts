import { MetricPoint } from '../metrics/types';

export interface SplunkAdapter {
  fetchSeries(appId: string, dc: string, hoursBack: number): Promise<MetricPoint[]>;
}
