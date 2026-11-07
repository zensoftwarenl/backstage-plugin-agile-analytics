import type {
  ErrorBudgetSeries,
  SloReportMetric,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import type { Tone } from './health';

// The rules below follow the reliability tile of the Agile Analytics web app.

export type SloSummary = {
  total: number;
  onTarget: number;
  overBudget: number;
  /** The SLOs with the least error budget left first. */
  lowest: SloReportMetric[];
};

/** How many SLOs meet their target, with the lowest error budgets first. */
export function summariseSlos(
  metrics: SloReportMetric[] | null | undefined,
): SloSummary {
  const slos = (metrics ?? []).filter(slo =>
    Number.isFinite(Number(slo?.errorBudget ?? NaN)),
  );
  const onTarget = slos.filter(
    // The value is in percent, the target a fraction
    slo => Number(slo.sloValue) >= Number(slo.sloTarget) * 100,
  ).length;
  const overBudget = slos.filter(slo => Number(slo.errorBudget) < 0).length;
  const lowest = [...slos].sort(
    (a, b) => Number(a.errorBudget) - Number(b.errorBudget),
  );
  return { total: slos.length, onTarget, overBudget, lowest };
}

export function budgetTone(budget: number): Tone {
  if (budget < 0) return 'danger';
  if (budget < 25) return 'warning';
  return 'success';
}

/** A target of 0.995 reads as 99.5%. */
export function formatTarget(target: number | string | null | undefined) {
  const n = Number(target);
  if (!Number.isFinite(n)) return '–';
  return `${Math.round(n * 1000) / 10}%`;
}

export function formatPercent(value: number | string | null | undefined) {
  const n = Number(value);
  if (value === null || value === undefined || !Number.isFinite(n)) return '–';
  return `${Math.round(n * 100) / 100}%`;
}

const seriesKey = (
  service: string | null | undefined,
  slo: string | undefined,
) => `${(service ?? '').toLowerCase()}\u0000${(slo ?? '').toLowerCase()}`;

/**
 * Finds the error budget over time of each SLO of the report, matched on
 * service and SLO name.
 */
export function budgetSeriesFinder(series: ErrorBudgetSeries[] | undefined) {
  const byKey = new Map(
    (series ?? []).map(s => [seriesKey(s.service, s.slo_name), s]),
  );
  return (slo: SloReportMetric) =>
    byKey.get(seriesKey(slo.service, slo.sloName));
}

/** The SLOs of one team; a team named " - " in the report has none. */
export function slosOfTeam(
  metrics: SloReportMetric[] | null | undefined,
  teamHash: string | undefined,
): SloReportMetric[] {
  return (metrics ?? []).filter(slo => !teamHash || slo.team_hash === teamHash);
}
