import type {
  DoraData,
  DoraOverviewMetric,
  FailedDeployment,
  LeadTime,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import type { Tone } from './health';
import { mean, median, repositoryName } from './format';

// The rules below follow the DORA panel of the Agile Analytics web app, so the
// numbers match what people see there.

export type DoraMetricId = DoraOverviewMetric['id'];

export type DoraBand = {
  key: 'low' | 'medium' | 'high' | 'elite';
  label: string;
  tone: Tone | 'info';
};

const DAY = 86_400;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

/**
 * DORA benchmark bands, highest first, as [band, value from which it applies]
 * for df (higher is better) and [band, value up to which it applies] for the
 * others. df is in deployments per day, lt in seconds, mttr in hours, cfr in
 * percent.
 */
const BANDS: Record<DoraMetricId, [DoraBand['key'], number][]> = {
  df: [
    ['elite', 1],
    ['high', 0.143],
    ['medium', 0.033],
    ['low', 0],
  ],
  lt: [
    ['elite', DAY],
    ['high', WEEK],
    ['medium', MONTH],
    ['low', Infinity],
  ],
  mttr: [
    ['elite', 1],
    ['high', 24],
    ['medium', 168],
    ['low', Infinity],
  ],
  cfr: [
    ['elite', 15],
    ['high', 30],
    ['medium', 46],
    ['low', Infinity],
  ],
};

const BAND_INFO: Record<DoraBand['key'], DoraBand> = {
  elite: { key: 'elite', label: 'Elite', tone: 'info' },
  high: { key: 'high', label: 'High', tone: 'success' },
  medium: { key: 'medium', label: 'Medium', tone: 'warning' },
  low: { key: 'low', label: 'Low', tone: 'danger' },
};

/** The DORA benchmark band a value falls in, if it has one. */
export function doraBand(
  id: DoraMetricId,
  value: number | null | undefined,
): DoraBand | undefined {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return undefined;
  }
  const match = BANDS[id].find(([, limit]) =>
    id === 'df' ? value >= limit : value <= limit,
  );
  return match ? BAND_INFO[match[0]] : undefined;
}

export const DORA_LABELS: Record<DoraMetricId, string> = {
  df: 'Deployment frequency',
  lt: 'Lead time for changes',
  mttr: 'Time to restore',
  cfr: 'Change failure rate',
};

export type DoraRepository = {
  repository: string;
  deployments: number;
  failed: number;
  changeFailureRate: number | null;
  leadTime: number | null;
};

export type DoraSummary = {
  /** Production deployments per day. */
  deploymentFrequency: number | null;
  /** Mean lead time for changes, in seconds. */
  leadTime: number | null;
  /** Mean time to restore, in hours. */
  timeToRestore: number | null;
  /** In percent. */
  changeFailureRate: number | null;
  productionDeployments: number;
  failedDeployments: FailedDeployment[];
  /** Production and failed deployments per UTC day, oldest first. */
  days: { start: number; deployments: number; failed: number }[];
  repositories: DoraRepository[];
  /** The changes behind the lead time, in the period. */
  leadTimes: LeadTime[];
  /** Every change deployed in the period, whichever of its times is known. */
  changes: LeadTime[];
  /** Failed deployments restored in the period, oldest first. */
  restores: { time: number; hours: number; repository: string }[];
  period: DoraData['period'];
};

function inPeriod(timestamp: number | null | undefined, data: DoraData) {
  return (
    typeof timestamp === 'number' &&
    timestamp >= data.period.start &&
    timestamp < data.period.end
  );
}

/**
 * The four DORA metrics over a period. For a team, lead times and failures
 * are narrowed to the repositories the team deployed from, as Agile Analytics
 * only reports deployments per team.
 */
export function summariseDora(data: DoraData): DoraSummary {
  const deployments = data.deployments.filter(d => inPeriod(d.timestamp, data));
  const teamRepositories = data.team
    ? new Set(deployments.map(d => repositoryName(d.repository)))
    : undefined;
  const ofTeam = (repository: string) =>
    !teamRepositories || teamRepositories.has(repositoryName(repository));

  const production = deployments.filter(d => d.production);
  const leadTimes = data.leadTimes.filter(
    lt =>
      ofTeam(lt.repository) &&
      inPeriod(lt.timestamp, data) &&
      typeof lt.lead_time_for_changes === 'number',
  );
  const changes = data.leadTimes.filter(
    lt => ofTeam(lt.repository) && inPeriod(lt.timestamp, data),
  );
  const failures = data.failures.filter(f => ofTeam(f.repository));
  const failedInPeriod = failures.filter(f => inPeriod(f.timestamp, data));
  const restores = failures
    .filter(
      f =>
        inPeriod(f.restored_at, data) && typeof f.time_to_restore === 'number',
    )
    .map(f => ({
      time: f.restored_at!,
      hours: f.time_to_restore! / 3600,
      repository: f.repository,
    }))
    .sort((a, b) => a.time - b.time);
  const restoreHours = restores.map(r => r.hours);

  const periodDays = Math.max(
    1,
    Math.round((data.period.end - data.period.start) / DAY),
  );
  const days = Array.from({ length: periodDays }, (_, i) => ({
    start: data.period.start + i * DAY,
    deployments: 0,
    failed: 0,
  }));
  const dayOf = (timestamp: number) =>
    days[Math.floor((timestamp - data.period.start) / DAY)];
  production.forEach(d => {
    const day = dayOf(d.timestamp);
    if (day) day.deployments += 1;
  });
  failedInPeriod.forEach(f => {
    const day = dayOf(f.timestamp);
    if (day) day.failed += 1;
  });

  const byRepository = new Map<string, DoraRepository & { lts: number[] }>();
  const row = (repository: string) => {
    const name = repositoryName(repository);
    let entry = byRepository.get(name);
    if (!entry) {
      entry = {
        repository: name,
        deployments: 0,
        failed: 0,
        changeFailureRate: null,
        leadTime: null,
        lts: [],
      };
      byRepository.set(name, entry);
    }
    return entry;
  };
  production.forEach(d => {
    row(d.repository).deployments += 1;
  });
  failedInPeriod.forEach(f => {
    row(f.repository).failed += 1;
  });
  leadTimes.forEach(lt => {
    row(lt.repository).lts.push(lt.lead_time_for_changes!);
  });
  const repositories = [...byRepository.values()]
    .map(({ lts, ...entry }) => ({
      ...entry,
      changeFailureRate: entry.deployments
        ? (entry.failed / entry.deployments) * 100
        : null,
      leadTime: median(lts),
    }))
    .sort(
      (a, b) =>
        b.deployments - a.deployments ||
        a.repository.localeCompare(b.repository),
    );

  return {
    deploymentFrequency: production.length / periodDays,
    leadTime: mean(leadTimes.map(lt => lt.lead_time_for_changes!)),
    timeToRestore: mean(restoreHours),
    changeFailureRate: production.length
      ? (failedInPeriod.length / production.length) * 100
      : null,
    productionDeployments: production.length,
    failedDeployments: [...failedInPeriod].sort(
      (a, b) => b.timestamp - a.timestamp,
    ),
    days,
    repositories,
    leadTimes,
    changes,
    restores,
    period: data.period,
  };
}

/** A DORA value of the overview report in the unit the bands use. */
export function overviewValue(metric: DoraOverviewMetric): number | null {
  return typeof metric.value === 'number' ? metric.value : null;
}

/**
 * The mean per day of values at times, in epoch seconds, as [epoch
 * milliseconds at noon, mean]; days without values are left out.
 */
export function dailyMeans(
  values: { time: number; value: number }[],
): [number, number][] {
  const days = new Map<number, number[]>();
  for (const { time, value } of values) {
    const day = Math.floor(time / DAY) * DAY;
    days.set(day, [...(days.get(day) ?? []), value]);
  }
  return [...days]
    .sort((a, b) => a[0] - b[0])
    .map(([day, all]) => [
      (day + DAY / 2) * 1000,
      all.reduce((sum, v) => sum + v, 0) / all.length,
    ]);
}
