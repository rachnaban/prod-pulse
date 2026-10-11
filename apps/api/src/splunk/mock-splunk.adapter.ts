import { Injectable } from '@nestjs/common';
import { MetricPoint } from '../metrics/types';
import { SplunkAdapter } from './splunk-adapter.interface';

const BUCKET_SEC = 300;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

@Injectable()
export class MockSplunkAdapter implements SplunkAdapter {
  async fetchSeries(appId: string, dc: string, hoursBack: number): Promise<MetricPoint[]> {
    const buckets = Math.max(12, Math.round((hoursBack * 3600) / BUCKET_SEC));
    const now = Math.floor(Date.now() / 1000);
    const endTime = Math.floor(now / BUCKET_SEC) * BUCKET_SEC;
    const rnd = mulberry32(hash(`${appId}::${dc}::${endTime}`));
    const baseRpm = 800 + rnd() * 2400;
    const baseP95 = 50 + rnd() * 90;
    const points: MetricPoint[] = [];
    let rpm = baseRpm;
    let incident = -1;
    let incidentLen = 0;

    for (let i = buckets - 1; i >= 0; i--) {
      const t = (endTime - i * BUCKET_SEC) * 1000;
      const hour = new Date(t).getUTCHours();
      const diurnal = 1 + 0.35 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
      rpm = rpm * 0.9 + baseRpm * diurnal * (0.85 + rnd() * 0.3) * 0.1;

      if (incidentLen > 0) {
        incidentLen--;
      } else if (rnd() < 0.006) {
        incidentLen = 2 + Math.floor(rnd() * 6);
      }
      const severity = incidentLen > 0 ? 1 : 0;

      const errRate = severity
        ? 1.5 + rnd() * 6
        : Math.max(0.005, 0.02 + (rnd() - 0.5) * 0.03);
      const p95 = Math.max(20, (baseP95 * (1 + (rnd() - 0.5) * 0.25) * (1 + severity * 2.2)) as number);
      const p99 = p95 * (1.3 + rnd() * 0.4);
      const avail = Math.max(95, 99.99 - errRate * 0.5 - (severity ? rnd() * 1.5 : 0));
      points.push({
        t,
        rpm: Math.round(rpm),
        p95Ms: Math.round(p95),
        p99Ms: Math.round(p99),
        errorRatePct: Number(errRate.toFixed(3)),
        availabilityPct: Number(avail.toFixed(4)),
      });
    }
    return points;
  }
}
