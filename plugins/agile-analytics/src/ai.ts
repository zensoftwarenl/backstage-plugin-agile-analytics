import type {
  AiAdoption,
  AiMergeRequest,
  AiVerdict,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import type { Tone } from './health';
import { repositoryName } from './format';

/** The adoption the Agile Analytics web app sets as its default target. */
export const AI_ADOPTION_TARGET = 0.5;

export type AiRepository = {
  repository: string;
  merged: number;
  aiAssisted: number;
  attributed: number;
  /** Fraction of attributed work that AI helped with. */
  share: number | null;
};

/** Merged work per repository with how much of it AI helped with. */
export function aiRepositories(
  mergeRequests: AiMergeRequest[] | undefined,
): AiRepository[] {
  const rows = new Map<string, AiRepository>();
  for (const mr of mergeRequests ?? []) {
    const name = repositoryName(mr.repository ?? '');
    const row = rows.get(name) ?? {
      repository: name,
      merged: 0,
      aiAssisted: 0,
      attributed: 0,
      share: null,
    };
    row.merged += 1;
    if (mr.ai_assisted !== null && mr.ai_assisted !== undefined) {
      row.attributed += 1;
      if (mr.ai_assisted) row.aiAssisted += 1;
    }
    rows.set(name, row);
  }
  return [...rows.values()]
    .map(row => ({
      ...row,
      share: row.attributed ? row.aiAssisted / row.attributed : null,
    }))
    .sort(
      (a, b) => b.merged - a.merged || a.repository.localeCompare(b.repository),
    );
}

/**
 * How often each AI tool shows up, from the merge requests and, where they
 * name more, the commits.
 */
export function aiTools(adoption: AiAdoption | undefined) {
  const counts = new Map<string, { mergeRequests: number; commits: number }>();
  for (const mr of adoption?.merge_requests ?? []) {
    if (!mr.ai_assisted || !mr.ai_tool) continue;
    const entry = counts.get(mr.ai_tool) ?? { mergeRequests: 0, commits: 0 };
    entry.mergeRequests += 1;
    counts.set(mr.ai_tool, entry);
  }
  for (const [tool, commits] of Object.entries(
    adoption?.commits?.tools ?? {},
  )) {
    const entry = counts.get(tool) ?? { mergeRequests: 0, commits: 0 };
    entry.commits = commits;
    counts.set(tool, entry);
  }
  return [...counts.entries()]
    .map(([tool, entry]) => ({ tool, ...entry }))
    .sort((a, b) => b.mergeRequests - a.mergeRequests || b.commits - a.commits);
}

/** The latest merged work AI helped with. */
export function recentAiMergeRequests(
  mergeRequests: AiMergeRequest[] | undefined,
  limit: number,
) {
  return (mergeRequests ?? [])
    .filter(mr => mr.ai_assisted)
    .sort((a, b) => (b.merged_date ?? 0) - (a.merged_date ?? 0))
    .slice(0, limit);
}

export function adoptionTone(
  rate: number | null | undefined,
): Tone | undefined {
  if (rate === null || rate === undefined) return undefined;
  if (rate >= AI_ADOPTION_TARGET) return 'success';
  if (rate >= AI_ADOPTION_TARGET / 2) return 'warning';
  return 'danger';
}

/** How a measure compares between AI assisted and other work, in words. */
export function describeVerdict(verdict: AiVerdict | undefined): {
  text: string;
  tone: Tone | 'secondary';
} {
  if (!verdict || verdict.difference === null || !verdict.reliable) {
    return { text: 'Not enough comparable work yet', tone: 'secondary' };
  }
  const faster = verdict.difference < 0;
  return {
    text: faster ? 'Faster with AI' : 'Slower with AI',
    tone: faster ? 'success' : 'warning',
  };
}
