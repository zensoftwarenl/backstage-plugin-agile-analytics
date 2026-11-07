import type { Period } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';

const DAY = 86_400;
const WEEK = 7 * DAY;

/**
 * The last `days` days up to the start of the next UTC day, in epoch seconds.
 * Ending on a day boundary keeps the upstream query, and so the cache key,
 * the same all day.
 */
export function periodFor(days: number, now = Date.now()): Period {
  const end = (Math.floor(now / 1000 / DAY) + 1) * DAY;
  return { start: end - days * DAY, end };
}

/**
 * The starts of the last four ISO weeks (Monday, UTC) and of next week, in
 * epoch seconds, oldest first: four weekly buckets ending with this week.
 */
export function weekBoundaries(now = Date.now()): number[] {
  const today = Math.floor(now / 1000 / DAY) * DAY;
  // 1 January 1970 was a Thursday
  const daysSinceMonday = (Math.floor(today / DAY) + 3) % 7;
  const thisWeek = today - daysSinceMonday * DAY;
  return [-3, -2, -1, 0, 1].map(offset => thisWeek + offset * WEEK);
}
