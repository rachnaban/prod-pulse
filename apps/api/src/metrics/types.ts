export interface AppRegistration {
  id: string;
  name: string;
  team: string;
  dcs: string[];
  indexes: string[];
  slo: Slo;
}

export interface Slo {
  errorRatePct: number;
  p95LatencyMs: number;
  availabilityPct: number;
}

export interface MetricPoint {
  t: number;
  rpm: number;
  p95Ms: number;
  p99Ms: number;
  errorRatePct: number;
  availabilityPct: number;
}

export type Band = 'green' | 'amber' | 'red';

export interface DcHealth {
  dc: string;
  score: number;
  band: Band;
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
