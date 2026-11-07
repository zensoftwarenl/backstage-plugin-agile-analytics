import {
  HEALTH_AREA_PILLARS,
  HealthAreaId,
  HealthMetric,
  HealthPillarId,
  Signal,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { signalUrl } from './links';

// The rules below follow the Agile Analytics web app, so Backstage shows the
// same score as Agile Analytics itself.

export type Tone = 'success' | 'warning' | 'danger';

export type Pillar = {
  id: HealthPillarId;
  name: string;
  description: string;
  score: number | null;
  metrics: HealthMetric[];
};

export const PILLARS: {
  id: HealthPillarId;
  name: string;
  description: string;
}[] = [
  {
    id: 'dev',
    name: 'DevEx',
    description:
      'Developer experience: AI support, repository health and recognition.',
  },
  {
    id: 'ops',
    name: 'OpsEx',
    description:
      'Operations experience: how changes reach production and keep running.',
  },
  {
    id: 'agile',
    name: 'AgileEx',
    description:
      'Agile experience: how work flows through sprints, and where the hours go.',
  },
];

export const AREA_LABELS: Record<HealthAreaId, string> = {
  delivery: 'Delivery',
  reliability: 'Reliability',
  flow: 'Flow',
  execution: 'Sprint predictability',
  investment: 'Hours efficiency',
  ai: 'AI adoption',
  collaboration: 'Repository health',
  kudos: 'Recognition',
  pulse: 'Developer experience survey',
};

const AREA_ORDER = Object.keys(HEALTH_AREA_PILLARS);

export const STATUS = {
  '-1': { tone: 'danger', label: 'Action needed' },
  '0': { tone: 'warning', label: 'Needs attention' },
  '1': { tone: 'success', label: 'On track' },
} as const;

export function areaLabel(metric: HealthMetric): string {
  return AREA_LABELS[metric.id as HealthAreaId] ?? metric.name ?? metric.id;
}

/** Areas without an `available` flag are available. */
export function isAvailable(metric: HealthMetric): boolean {
  return !('available' in metric) || !!metric.available;
}

/**
 * The flow area without an `available` flag reports the age of the oldest
 * ticket in days rather than a 0-100 score, so it is left out of averages.
 */
export function isMeasuredInDays(metric: HealthMetric): boolean {
  return metric.id === 'flow' && !('available' in metric);
}

export function scoreTone(score: number): Tone {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function groupByPillar(metrics: HealthMetric[]): Pillar[] {
  const sorted = [...metrics].sort((a, b) => {
    const index = (m: HealthMetric) => {
      const i = AREA_ORDER.indexOf(m.id);
      return i === -1 ? AREA_ORDER.length : i;
    };
    return index(a) - index(b);
  });
  return PILLARS.map(pillar => {
    const inPillar = sorted.filter(
      m => HEALTH_AREA_PILLARS[m.id as HealthAreaId] === pillar.id,
    );
    const scores = inPillar
      .filter(m => isAvailable(m) && !isMeasuredInDays(m))
      .map(m => Number(m.score) || 0);
    return { ...pillar, metrics: inPillar, score: average(scores) };
  });
}

/** The engineering health score: the average of the three pillars. */
export function totalScore(pillars: Pillar[]): number | null {
  return average(
    pillars.map(p => p.score).filter((s): s is number => s !== null),
  );
}

export function areasNeedingAttention(metrics: HealthMetric[]) {
  const scored = metrics.filter(
    m => isAvailable(m) && m.status !== null && m.status !== undefined,
  );
  return {
    count: scored.filter(m => Number(m.status) <= 0).length,
    total: scored.length,
  };
}

/** A short line explaining what an area's score is based on. */
export function areaBasis(metric: HealthMetric): string | undefined {
  if (metric.needs === 'jira_board') {
    return 'Connect a Jira board to measure this';
  }
  if (
    metric.id === 'execution' &&
    !isAvailable(metric) &&
    typeof metric.sprints === 'number' &&
    metric.min_sprints
  ) {
    return `Needs ${metric.min_sprints} closed sprints, has ${metric.sprints}`;
  }
  if (!isAvailable(metric)) {
    return 'Not set up yet, or nothing measured';
  }
  if (metric.id === 'investment' && metric.workers) {
    return `Covers ${plural(metric.workers, 'person', 'people')}`;
  }
  if (metric.id === 'ai') {
    if (metric.adoption === null || metric.adoption === undefined) {
      return 'Merge requests with commits co-authored by an AI assistant';
    }
    return `${
      Math.round(metric.adoption * 10) / 10
    }% of merge requests AI-assisted · full score at ${metric.target}%`;
  }
  if (metric.id === 'reliability' && metric.slos) {
    return `${metric.within_budget ?? 0} of ${plural(
      metric.slos,
      'SLO',
      'SLOs',
    )} within budget`;
  }
  if (metric.id === 'pulse' && metric.respondents) {
    return `${plural(
      metric.respondents,
      'person',
      'people',
    )} answered the latest survey`;
  }
  if (metric.id === 'flow') {
    if (isMeasuredInDays(metric)) return 'Age of the oldest open ticket';
    if (metric.oldest_days !== null && metric.oldest_days !== undefined) {
      return `Oldest item in progress: ${plural(
        metric.oldest_days,
        'day',
        'days',
      )}`;
    }
  }
  return undefined;
}

function plural(count: number, one: string, other: string) {
  return `${count} ${count === 1 ? one : other}`;
}

const TIERS: Record<number, string> = {
  4: 'Elite',
  3: 'High',
  2: 'Medium',
  1: 'Low',
};

const DORA_METRICS: Record<string, string> = {
  df: 'Deployment frequency',
  lt: 'Lead time for changes',
  mttr: 'Time to restore',
  cfr: 'Change failure rate',
};

const GOOD_SIGNALS = [
  'recovered',
  'slo_resolved',
  'tier_improved',
  'target_met',
];

function formatNumber(value: number | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Describes a signal the way the Agile Analytics overview does. */
export function describeSignal(signal: Signal): {
  text: string;
  good: boolean;
  url?: string;
} {
  const area = signal.area
    ? AREA_LABELS[signal.area as HealthAreaId] ?? signal.area
    : '';
  const metric = signal.metric
    ? DORA_METRICS[signal.metric] ?? signal.metric
    : '';
  const tier = (v: number | null | undefined) => TIERS[v ?? 0] ?? '–';
  const slo = [signal.service, signal.slo].filter(Boolean).join(' · ');
  const before = formatNumber(signal.before);
  const after = formatNumber(signal.after);

  const texts: Record<string, string> = {
    slipped: `${area} slipped from ${before} to ${after}`,
    slipped_further: `${area} slipped further, from ${before} to ${after}`,
    recovered: `${area} is back at ${after}, up from ${before}`,
    slo_over_budget: `${slo} is over its error budget`,
    slo_resolved: `${slo} is back within its error budget`,
    bus_factor: `${signal.repository} now rests on one person`,
    orphaned: `${signal.repository} has nobody active left`,
    stale_work: `${signal.key} has been in progress for ${signal.age_days} days`,
    tier_dropped: `${metric} dropped from ${tier(signal.before)} to ${tier(
      signal.after,
    )}`,
    tier_improved: `${metric} is up from ${tier(signal.before)} to ${tier(
      signal.after,
    )}`,
    target_missed: `${metric} missed its target: ${formatNumber(
      signal.value,
    )} against ${formatNumber(signal.target)}`,
    target_met: `${metric} is back on its target: ${formatNumber(
      signal.value,
    )} (target ${formatNumber(signal.target)})`,
  };

  return {
    text: texts[signal.kind] ?? signal.summary ?? signal.kind,
    good: GOOD_SIGNALS.includes(signal.kind),
    url: signalUrl(signal),
  };
}
