import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { MetricPoint } from '../metrics/types';
import { SplunkAdapter } from './splunk-adapter.interface';

interface SummaryRow {
  _time: string;
  dc?: string;
  service?: string;
  rpm?: number;
  p95?: number;
  p99?: number;
  err_pct?: number;
  avail?: number;
}

@Injectable()
export class RealSplunkAdapter implements SplunkAdapter {
  private readonly logger = new Logger(RealSplunkAdapter.name);

  constructor(private cfg: ConfigService) {}

  private get url(): string {
    return (this.cfg.get<string>('splunk.url') ?? '').replace(/\/$/, '');
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.cfg.get<string>('splunk.token')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  async fetchSeries(appId: string, dc: string, hoursBack: number): Promise<MetricPoint[]> {
    const summaryIndex = this.cfg.get<string>('splunk.summaryIndex');
    const search =
      `search index=${summaryIndex} service=${appId} dc=${dc} earliest=-${hoursBack}h` +
      ` | eval rpm=coalesce(rpm,0), p95=coalesce(p95,0), p99=coalesce(p99,0),` +
      ` err_pct=coalesce(err_pct,0), avail=coalesce(avail,1)` +
      ` | sort _time | table _time rpm p95 p99 err_pct avail`;

    const body = new URLSearchParams({ search, exec_mode: 'normal', output_mode: 'json' });
    const created = await axios.post(`${this.url}/services/search/jobs`, body.toString(), { headers: this.headers });
    const sid: string = created.data.sid;

    try {
      await this.waitForJob(sid);
      const res = await axios.get(`${this.url}/services/search/jobs/${sid}/results?output_mode=json&count=10000`, { headers: this.headers });
      const rows = (res.data.results ?? []) as SummaryRow[];
      return rows.map((r) => ({
        t: new Date(r._time + 'Z').getTime(),
        rpm: Number(r.rpm ?? 0),
        p95Ms: Number(r.p95 ?? 0),
        p99Ms: Number(r.p99 ?? 0),
        errorRatePct: Number(r.err_pct ?? 0),
        availabilityPct: Number(r.avail ?? 1),
      }));
    } finally {
      await axios.delete(`${this.url}/services/search/jobs/${sid}`, { headers: this.headers }).catch(() => undefined);
    }
  }

  private async waitForJob(sid: string, timeoutMs = 60000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await axios.get(`${this.url}/services/search/jobs/${sid}?output_mode=json`, { headers: this.headers });
      const done = res.data.entry?.[0]?.content?.isDone;
      if (done) return;
      if (res.data.entry?.[0]?.content?.isFailed) throw new Error(`Splunk job ${sid} failed`);
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error(`Splunk job ${sid} timed out`);
  }
}
