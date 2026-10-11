import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { RegistryService } from '../registry/registry.service';
import { MetricsStore } from './metrics.store';
import { healthScore, band } from './health-score';
import { MetricPoint, FleetApp, DcHealth } from './types';

@Controller('api')
export class MetricsController {
  constructor(
    private registry: RegistryService,
    private store: MetricsStore,
  ) {}

  @Get('fleet')
  async fleet(): Promise<FleetApp[]> {
    const apps = this.registry.list();
    return Promise.all(
      apps.map(async (app) => {
        const dcs: DcHealth[] = (
          await Promise.all(
            app.dcs.map((dc) =>
              this.store.dcHealth(app.id, dc, app.slo, (p, s) => {
                const score = healthScore(p.errorRatePct, p.p95Ms, p.availabilityPct, s);
                return { score, band: band(score) };
              }),
            ),
          )
        ).filter((d): d is DcHealth => d !== null);
        const worstScore = dcs.length ? Math.min(...dcs.map((d) => d.score)) : 0;
        return { id: app.id, name: app.name, team: app.team, dcs, worstScore };
      }),
    );
  }

  @Get('dcs')
  async dcs() {
    const byDc = new Map<string, { scores: number[]; rpm: number; err: number }>();
    for (const app of this.registry.list()) {
      for (const dc of app.dcs) {
        const h = await this.store.dcHealth(app.id, dc, app.slo, (p, s) => {
          const score = healthScore(p.errorRatePct, p.p95Ms, p.availabilityPct, s);
          return { score, band: band(score) };
        });
        if (!h) continue;
        const entry = byDc.get(dc) ?? { scores: [], rpm: 0, err: 0 };
        entry.scores.push(h.score);
        entry.rpm += h.rpm;
        entry.err += h.errorRatePct;
        byDc.set(dc, entry);
      }
    }
    return [...byDc.entries()].map(([dc, v]) => ({
      dc,
      apps: v.scores.length,
      avgScore: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
      totalRpm: Math.round(v.rpm),
      avgErrorRatePct: Number((v.err / Math.max(v.scores.length, 1)).toFixed(2)),
    }));
  }

  @Get('dc-names')
  dcNames(): string[] {
    return this.registry.getDcs();
  }

  @Get('apps/:id/metrics')
  async appMetrics(
    @Param('id') id: string,
    @Query('dc') dc?: string,
    @Query('range') range?: string,
  ) {
    const app = this.registry.get(id);
    if (!app) throw new NotFoundException(`Unknown app ${id}`);
    const dcName = dc ?? app.dcs[0];
    const hours = range === '6h' ? 6 : range === '1h' ? 1 : 24;
    const cutoff = Date.now() - hours * 3600 * 1000;
    const points: MetricPoint[] = (await this.store.getSeries(id, dcName)).filter((p) => p.t >= cutoff);
    const latest = await this.store.latest(id, dcName);
    const score = latest ? healthScore(latest.errorRatePct, latest.p95Ms, latest.availabilityPct, app.slo) : 0;
    return { app, dc: dcName, range: `${hours}h`, points, score, band: band(score) };
  }
}
