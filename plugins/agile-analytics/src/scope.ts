import { useSearchParams } from 'react-router-dom';
import {
  PERIOD_DAYS,
  PeriodDays,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';

export const DEFAULT_DAYS: PeriodDays = 14;

/**
 * The team and period the tabs show, kept in the URL so a view can be linked
 * to and survives switching tabs.
 */
export function useScope() {
  const [searchParams, setSearchParams] = useSearchParams();
  const team = searchParams.get('team') || undefined;
  const requested = Number(searchParams.get('days'));
  const days: PeriodDays = (PERIOD_DAYS as readonly number[]).includes(
    requested,
  )
    ? (requested as PeriodDays)
    : DEFAULT_DAYS;

  const update = (key: string, value: string | undefined) =>
    setSearchParams(
      previous => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  return {
    team,
    days,
    setTeam: (hash: string | undefined) => update('team', hash),
    setDays: (value: number) =>
      update('days', value === DEFAULT_DAYS ? undefined : String(value)),
  };
}

/** A backend path with the scope as query parameters. */
export function scopedPath(
  path: string,
  scope: { days?: number; team?: string },
): string {
  const query = new URLSearchParams();
  if (scope.days) query.set('days', String(scope.days));
  if (scope.team) query.set('team', scope.team);
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}
