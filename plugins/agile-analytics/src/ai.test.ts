import {
  aiRepositories,
  aiTools,
  describeVerdict,
  recentAiMergeRequests,
} from './ai';

const mergeRequests = [
  {
    repository: 'acme/api',
    ai_assisted: true,
    ai_tool: 'Claude',
    merged_date: 3,
  },
  {
    repository: 'git@gitlab.com:acme/api.git',
    ai_assisted: false,
    merged_date: 2,
  },
  { repository: 'acme/api', ai_assisted: null, merged_date: 1 },
  {
    repository: 'acme/web',
    ai_assisted: true,
    ai_tool: 'Copilot',
    merged_date: 4,
  },
];

describe('aiRepositories', () => {
  it('counts the adoption of attributed work per repository', () => {
    expect(aiRepositories(mergeRequests)).toEqual([
      {
        repository: 'acme/api',
        merged: 3,
        aiAssisted: 1,
        attributed: 2,
        share: 0.5,
      },
      {
        repository: 'acme/web',
        merged: 1,
        aiAssisted: 1,
        attributed: 1,
        share: 1,
      },
    ]);
  });
});

describe('aiTools', () => {
  it('combines merge request and commit counts per tool', () => {
    expect(
      aiTools({
        total: 4,
        attributed: 3,
        ai_assisted: 2,
        not_ai_assisted: 1,
        unattributed: 1,
        coverage: 0.75,
        adoption_rate: 0.67,
        merge_requests: mergeRequests,
        commits: {
          total: 10,
          ai_assisted: 6,
          adoption_rate: 0.6,
          tools: { Claude: 5, Cursor: 1 },
        },
      }),
    ).toEqual([
      { tool: 'Claude', mergeRequests: 1, commits: 5 },
      { tool: 'Copilot', mergeRequests: 1, commits: 0 },
      { tool: 'Cursor', mergeRequests: 0, commits: 1 },
    ]);
  });
});

describe('recentAiMergeRequests', () => {
  it('returns the latest AI assisted merges', () => {
    expect(
      recentAiMergeRequests(mergeRequests, 1).map(mr => mr.repository),
    ).toEqual(['acme/web']);
  });
});

describe('describeVerdict', () => {
  const verdict = {
    repositories: 3,
    ai_count: 10,
    other_count: 10,
    ai_typical: 100,
    other_typical: 200,
    difference: -100,
    reliable: true,
  };

  it('only draws a conclusion from reliable comparisons', () => {
    expect(describeVerdict(verdict).text).toBe('Faster with AI');
    expect(describeVerdict({ ...verdict, reliable: false }).text).toBe(
      'Not enough comparable work yet',
    );
  });
});
