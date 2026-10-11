import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppRegistration } from '../metrics/types';

const FALLBACK_DCS = [
  'dc-us-east',
  'dc-us-west',
  'dc-us-central',
  'dc-eu-1',
  'dc-eu-2',
  'dc-apac-1',
  'dc-apac-2',
  'dc-latam-1',
];

const APP_SEED: Array<Omit<AppRegistration, 'dcs'>> = [
  { id: 'checkout-api', name: 'Checkout API', team: 'Payments', indexes: ['idx_checkout'], slo: { errorRatePct: 0.5, p95LatencyMs: 300, availabilityPct: 99.9 } },
  { id: 'auth-service', name: 'Auth Service', team: 'Identity', indexes: ['idx_auth'], slo: { errorRatePct: 0.2, p95LatencyMs: 250, availabilityPct: 99.95 } },
  { id: 'catalog-svc', name: 'Catalog Service', team: 'Storefront', indexes: ['idx_catalog'], slo: { errorRatePct: 1, p95LatencyMs: 400, availabilityPct: 99.5 } },
  { id: 'search-svc', name: 'Search Service', team: 'Storefront', indexes: ['idx_search'], slo: { errorRatePct: 1, p95LatencyMs: 500, availabilityPct: 99.5 } },
  { id: 'inventory-svc', name: 'Inventory Service', team: 'Supply Chain', indexes: ['idx_inventory'], slo: { errorRatePct: 0.5, p95LatencyMs: 350, availabilityPct: 99.8 } },
  { id: 'notify-gw', name: 'Notification Gateway', team: 'Platform', indexes: ['idx_notify'], slo: { errorRatePct: 1, p95LatencyMs: 600, availabilityPct: 99.5 } },
  { id: 'reporting-api', name: 'Reporting API', team: 'Data', indexes: ['idx_reporting'], slo: { errorRatePct: 2, p95LatencyMs: 1200, availabilityPct: 99 } },
  { id: 'media-cdn', name: 'Media CDN', team: 'Platform', indexes: ['idx_media'], slo: { errorRatePct: 0.5, p95LatencyMs: 200, availabilityPct: 99.9 } },
];

@Injectable()
export class RegistryService {
  private apps = new Map<string, AppRegistration>();
  private readonly dcs: string[];
  onAppRegistered?: (app: AppRegistration) => void;

  constructor(private cfg: ConfigService) {
    this.dcs = cfg.get<string[]>('dcs') ?? FALLBACK_DCS;
    for (const seed of APP_SEED) {
      this.apps.set(seed.id, { ...seed, dcs: [...this.dcs] });
    }
  }

  getDcs(): string[] {
    return this.dcs;
  }

  list(): AppRegistration[] {
    return [...this.apps.values()];
  }

  get(id: string): AppRegistration | undefined {
    return this.apps.get(id);
  }

  upsert(input: Partial<AppRegistration>): AppRegistration {
    const id = (input.id ?? input.name ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!id) throw new Error('App id or name is required');
    const app: AppRegistration = {
      id,
      name: input.name ?? id,
      team: input.team ?? 'unknown',
      dcs: input.dcs && input.dcs.length > 0 ? input.dcs : [...this.dcs],
      indexes: input.indexes && input.indexes.length > 0 ? input.indexes : [`idx_${id.replace(/-/g, '_')}`],
      slo: input.slo ?? { errorRatePct: 0.5, p95LatencyMs: 300, availabilityPct: 99.9 },
    };
    this.apps.set(app.id, app);
    this.onAppRegistered?.(app);
    return app;
  }
}
