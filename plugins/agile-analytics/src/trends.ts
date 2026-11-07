import type { TrendBucket } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { median } from './format';

/** How many buckets the latest numbers and the ones they compare to span. */
export const COMPARE_BUCKETS = 4;

export type TrendTotals = {
  /** Production deployments per day. */
  deploymentFrequency: number | null;
  /** The median of the buckets' median lead times, in seconds. */
  leadTime: number | null;
  /** Fraction. */
  changeFailureRate: number | null;
  /** Fraction of attributed merged work AI helped with. */
  aiShare: number | null;
};

function totals(buckets: TrendBucket[]): TrendTotals | undefined {
  if (!buckets.length) return undefined;
  const sum = (pick: (b: TrendBucket) => number) =>
    buckets.reduce((total, b) => total + (pick(b) || 0), 0);
  const days = sum(b => b.days);
  const deployments = sum(b => b.deployments);
  const attributed = sum(b => b.ai_assisted) + sum(b => b.not_ai_assisted);
  return {
    deploymentFrequency: days ? deployments / days : null,
    leadTime: median(
      buckets
        .map(b => b.lead_time_for_changes)
        .filter((v): v is number => typeof v === 'number'),
    ),
    changeFailureRate: deployments
      ? sum(b => b.failed_deployments) / deployments
      : null,
    aiShare: attributed ? sum(b => b.ai_assisted) / attributed : null,
  };
}

/**
 * The latest complete buckets against the ones before, leaving out the
 * bucket still in progress.
 */
export function compareRecent(buckets: TrendBucket[]): {
  recent?: TrendTotals;
  previous?: TrendTotals;
} {
  const complete = buckets.filter(b => !b.partial);
  const recent = complete.slice(-COMPARE_BUCKETS);
  const previous = complete.slice(-2 * COMPARE_BUCKETS, -COMPARE_BUCKETS);
  return { recent: totals(recent), previous: totals(previous) };
}

export type Change = { text: string; tone: 'success' | 'danger' | 'secondary' };

/**
 * How a value moved, worded for people. `higherIsBetter` decides the tone;
 * changes under 5% count as unchanged.
 */
export function describeChange(
  recent: number | null | undefined,
  previous: number | null | undefined,
  higherIsBetter: boolean,
): Change | undefined {
  if (
    recent === null ||
    recent === undefined ||
    previous === null ||
    previous === undefined
  ) {
    return undefined;
  }
  if (previous === 0) {
    if (recent === 0) return { text: 'Unchanged', tone: 'secondary' };
    return {
      text: 'Up from none',
      tone: higherIsBetter ? 'success' : 'danger',
    };
  }
  const change = (recent - previous) / Math.abs(previous);
  if (Math.abs(change) < 0.05) return { text: 'Unchanged', tone: 'secondary' };
  const better = change > 0 === higherIsBetter;
  return {
    text: `${change > 0 ? 'Up' : 'Down'} ${Math.round(
      Math.abs(change) * 100,
    )}%`,
    tone: better ? 'success' : 'danger',
  };
}
