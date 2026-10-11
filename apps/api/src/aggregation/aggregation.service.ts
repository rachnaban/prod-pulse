import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { RegistryService } from '../registry/registry.service';
import { MetricsStore } from '../metrics/metrics.store';
import { AppRegistration } from '../metrics/types';
import { SPLUNK_ADAPTER } from '../splunk/splunk.module';
import { SplunkAdapter } from '../splunk/splunk-adapter.interface';

@Injectable()
export class AggregationService implements OnModuleInit {
  private readonly logger = new Logger(AggregationService.name);
  private running = false;

  constructor(
    private registry: RegistryService,
    private store: MetricsStore,
    @Inject(SPLUNK_ADAPTER) private adapter: SplunkAdapter,
    private cfg: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.registry.onAppRegistered = (app) => {
      void this.pullApp(app);
    };
    await this.run();
  }

  @Interval(process.env.AGG_INTERVAL_SEC ? Number(process.env.AGG_INTERVAL_SEC) * 1000 : 60000)
  async tick(): Promise<void> {
    await this.run();
  }

  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const apps = this.registry.list();
      const results = await Promise.allSettled(apps.map((app) => this.pullApp(app)));
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      this.logger.log(`Aggregated ${ok}/${results.length} app series`);
    } finally {
      this.running = false;
    }
  }

  private async pullApp(app: AppRegistration): Promise<void> {
    const results = await Promise.allSettled(
      app.dcs.map(async (dc) => {
        const points = await this.adapter.fetchSeries(app.id, dc, 24);
        await this.store.setSeries(app.id, dc, points);
      }),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      this.logger.warn(`${app.id}: ${failed}/${app.dcs.length} DC pulls failed`);
    }
  }
}
