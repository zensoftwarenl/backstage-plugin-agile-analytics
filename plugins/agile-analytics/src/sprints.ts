import type { SprintReport } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import type { Tone } from './health';

// The rules below follow the sprint insights page of the Agile Analytics web app.

/** The age buckets of work in progress, youngest first. */
export const AGE_BUCKETS: { id: string; label: string; tone: Tone | 'info' }[] =
  [
    { id: 'under_2', label: 'Under 2 days', tone: 'success' },
    { id: '2_to_5', label: '2 to 5 days', tone: 'success' },
    { id: '5_to_10', label: '5 to 10 days', tone: 'success' },
    { id: '10_to_30', label: '10 to 30 days', tone: 'warning' },
    { id: 'over_30', label: 'Over 30 days', tone: 'danger' },
  ];

/** The scored sprints, oldest first. */
export function recentSprints(report: SprintReport | null | undefined) {
  return [...(report?.predictability?.sprints ?? [])].sort((a, b) =>
    a.end.localeCompare(b.end),
  );
}
