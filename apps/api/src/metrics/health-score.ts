import { Slo } from '../metrics/types';

export function healthScore(
  errorRatePct: number,
  p95Ms: number,
  availabilityPct: number,
  slo: Slo,
): number {
  const errPenalty = 50 * Math.min(1, errorRatePct / Math.max(slo.errorRatePct, 0.001));
  const latPenalty = 30 * Math.min(1, p95Ms / Math.max(slo.p95LatencyMs, 1));
  const availPenalty = 20 * Math.max(0, 1 - availabilityPct / Math.max(slo.availabilityPct, 0.001));
  return Math.max(0, Math.round(100 - errPenalty - latPenalty - availPenalty));
}

export function band(score: number): 'green' | 'amber' | 'red' {
  if (score >= 90) return 'green';
  if (score >= 70) return 'amber';
  return 'red';
}
