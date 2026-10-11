export interface MetricPoint {
  t: number;
  rpm: number;
  p95Ms: number;
  p99Ms: number;
  errorRatePct: number;
  availabilityPct: number;
}

export interface DcHealth {
  dc: string;
  score: number;
  band: 'green' | 'amber' | 'red';
  rpm: number;
  p95Ms: number;
  errorRatePct: number;
  availabilityPct: number;
  stale: boolean;
}

export interface FleetApp {
  id: string;
  name: string;
  team: string;
  dcs: DcHealth[];
  worstScore: number;
}

export interface Slo {
  errorRatePct: number;
  p95LatencyMs: number;
  availabilityPct: number;
}

export interface AppRegistration {
  id: string;
  name: string;
  team: string;
  dcs: string[];
  indexes: string[];
  slo: Slo;
}

export interface AppMetrics {
  app: AppRegistration;
  dc: string;
  range: string;
  points: MetricPoint[];
  score: number;
  band: 'green' | 'amber' | 'red';
}

export interface DcRollup {
  dc: string;
  apps: number;
  avgScore: number;
  totalRpm: number;
  avgErrorRatePct: number;
}
