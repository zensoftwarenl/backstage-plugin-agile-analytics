import type {
  Collaboration,
  RepositoryStatus,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import type { Tone } from './health';

// The rules below follow the collaboration page of the Agile Analytics web app.

export const STATUSES: {
  id: RepositoryStatus;
  label: string;
  tone: Tone | 'info';
  description: string;
}[] = [
  {
    id: 'orphaned',
    label: 'Orphaned',
    tone: 'danger',
    description: 'Nobody who worked on it is still active',
  },
  {
    id: 'at_risk',
    label: 'At risk',
    tone: 'warning',
    description: 'Only one active person knows it',
  },
  {
    id: 'dormant',
    label: 'Dormant',
    tone: 'info',
    description: 'No recent work, but people who know it are still around',
  },
  {
    id: 'healthy',
    label: 'Healthy',
    tone: 'success',
    description: 'Several active people know it',
  },
];

export const STATUS_BY_ID = Object.fromEntries(
  STATUSES.map(status => [status.id, status]),
) as Record<RepositoryStatus, (typeof STATUSES)[number]>;

/** Statuses that need someone to act, worst first. */
const NEEDS_ATTENTION: RepositoryStatus[] = ['orphaned', 'at_risk'];

export type CollaborationSummary = {
  activePeople: number;
  people: number;
  statusCounts: Record<RepositoryStatus, number>;
  /** Orphaned and at risk repositories, worst and busiest first. */
  attention: Collaboration['repositories'];
  teams: Collaboration['teams'];
  repositories: Collaboration['repositories'];
};

/**
 * People and repository ownership, for the organisation or one team. A team
 * is narrowed to its own members and the repositories it is linked to.
 */
export function summariseCollaboration(
  data: Collaboration,
  teamHash?: string,
): CollaborationSummary {
  const team = teamHash ? data.teams.find(t => t.hash === teamHash) : undefined;
  const members = team ? new Set(team.members) : undefined;
  const teamRepositories = team ? new Set(team.repositories) : undefined;

  const people = data.people.filter(p => !members || members.has(p.id));
  const repositories = data.repositories.filter(
    r => !teamRepositories || teamRepositories.has(r.repository),
  );

  const statusCounts = Object.fromEntries(
    STATUSES.map(s => [s.id, 0]),
  ) as Record<RepositoryStatus, number>;
  repositories.forEach(r => {
    if (r.status in statusCounts) statusCounts[r.status] += 1;
  });

  const attention = repositories
    .filter(r => NEEDS_ATTENTION.includes(r.status))
    .sort(
      (a, b) =>
        NEEDS_ATTENTION.indexOf(a.status) - NEEDS_ATTENTION.indexOf(b.status) ||
        (b.activity ?? 0) - (a.activity ?? 0),
    );

  return {
    activePeople: people.filter(p => p.active).length,
    people: people.length,
    statusCounts,
    attention,
    teams: team ? [team] : data.teams,
    repositories,
  };
}

/** The people who know a repository best, e.g. `Ann (60%), Bob (25%)`. */
export function describeOwners(
  owners: Collaboration['repositories'][number]['owners'],
  limit = 3,
): string {
  return [...owners]
    .sort((a, b) => b.share - a.share)
    .slice(0, limit)
    .map(
      o =>
        `${o.name} (${Math.round(o.share * 100)}%${
          o.active ? '' : ', inactive'
        })`,
    )
    .join(', ');
}

/**
 * The share of kudos the most thanked fifth of the people who got any
 * received, from counts per person. High means recognition goes to few.
 */
export function topFifthShare(distribution: number[]): number | null {
  const total = distribution.reduce((sum, count) => sum + count, 0);
  if (!total || distribution.length < 5) return null;
  const top = [...distribution]
    .sort((a, b) => b - a)
    .slice(0, Math.ceil(distribution.length / 5));
  return top.reduce((sum, count) => sum + count, 0) / total;
}
