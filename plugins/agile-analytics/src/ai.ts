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

const DAY_MS = 86_400_000;

export type AiBucket = {
  /** Epoch milliseconds of the bucket's local midnight. */
  start: number;
  aiAssisted: number;
  notAiAssisted: number;
  unattributed: number;
};

/**
 * Merged work per day, or per week over more than 31 days, split by whether
 * AI helped, from the first day of the period to today. Quiet days keep their
 * place, so the bars line up with the calendar.
 */
export function aiPerBucket(
  mergeRequests: AiMergeRequest[] | undefined,
  days: number,
  now = Date.now(),
): AiBucket[] {
  const size = days > 31 ? 7 : 1;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const first = today.getTime() - (days - 1) * DAY_MS;
  const count = Math.ceil(days / size);
  const buckets: AiBucket[] = Array.from({ length: count }, (_, i) => ({
    start: first + i * size * DAY_MS,
    aiAssisted: 0,
    notAiAssisted: 0,
    unattributed: 0,
  }));
  for (const mr of mergeRequests ?? []) {
    if (!mr.merged_date) continue;
    const index = Math.floor((mr.merged_date * 1000 - first) / (size * DAY_MS));
    const bucket = buckets[index];
    if (!bucket) continue;
    if (mr.ai_assisted === true) bucket.aiAssisted += 1;
    else if (mr.ai_assisted === false) bucket.notAiAssisted += 1;
    else bucket.unattributed += 1;
  }
  return buckets;
}
