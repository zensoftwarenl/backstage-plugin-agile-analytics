import { fetchApiRef } from '@backstage/frontend-plugin-api';
import { renderInTestApp } from '@backstage/frontend-test-utils';
import { screen } from '@testing-library/react';
import { AgileAnalyticsRoot } from './AgileAnalyticsRoot';

const DAY = 86_400;
const START = 1_800_000_000 - (1_800_000_000 % DAY);

const responses: Record<string, unknown> = {
  'plugin://agile-analytics/organisation': {
    org_hash: 'ORG1',
    org_name: 'Acme',
  },
  'plugin://agile-analytics/teams': [],
  'plugin://agile-analytics/health': { metrics: [] },
  'plugin://agile-analytics/signals': [],
  'plugin://agile-analytics/dora/summary': {
    timestamp: '2026-10-29T03:00:00Z',
    metrics: [
      { id: 'df', value: 1.5, trend: 1, change: 0.2 },
      { id: 'lt', value: 7200, trend: 0, change: 0 },
      { id: 'mttr', value: 'not available', trend: 0, change: 0 },
      { id: 'cfr', value: 20, trend: -1, change: 5 },
    ],
  },
  'plugin://agile-analytics/dora': {
    period: { start: START, end: START + 14 * DAY },
    team: null,
    deployments: [
      { repository: 'acme/api', timestamp: START + 10, production: true },
      { repository: 'acme/api', timestamp: START + DAY, production: true },
    ],
    leadTimes: [
      {
        repository: 'acme/api',
        lead_time: 1,
        cycle_time: 1,
        lead_time_for_changes: 3600,
        timestamp: START + 10,
      },
    ],
    failures: [
      {
        repository: 'acme/api',
        timestamp: START + DAY,
        restored_at: START + DAY + 1800,
        time_to_restore: 1800,
        remediations: [
          {
            source_branch: 'hotfix/x',
            title: 'Revert the cache',
            merged_date: START + DAY + 900,
            deployment_date: START + DAY + 1800,
          },
        ],
      },
    ],
  },
  'plugin://agile-analytics/ai/adoption': {
    total: 10,
    attributed: 8,
    ai_assisted: 6,
    not_ai_assisted: 2,
    unattributed: 2,
    coverage: 0.8,
    adoption_rate: 0.75,
    merge_requests: [
      {
        repository: 'acme/api',
        title: 'Faster builds',
        ai_assisted: true,
        ai_tool: 'Claude',
        merged_date: START,
      },
    ],
    commits: { total: 20, ai_assisted: 10, adoption_rate: 0.5, tools: {} },
  },
  'plugin://agile-analytics/ai/delivery': {
    metrics: {
      time_to_merge: {
        repositories: 2,
        ai_count: 6,
        other_count: 6,
        ai_typical: 3600,
        other_typical: 7200,
        difference: -3600,
        reliable: true,
      },
    },
  },
  'plugin://agile-analytics/ai/quality': {
    cohorts: {
      high_ai: {
        repositories: 1,
        deployments: 10,
        failed_deployments: 1,
        change_failure_rate: 0.1,
      },
      low_ai: {
        repositories: 1,
        deployments: 10,
        failed_deployments: 2,
        change_failure_rate: 0.2,
      },
    },
  },
  'plugin://agile-analytics/ai/cost': {
    cost: { currency: 'EUR', configured: false },
    return: null,
  },
  'plugin://agile-analytics/reviews': {
    merged: 40,
    approved: 36,
    without_approval: 4,
    unknown: 0,
    without_approval_share: 0.1,
    wait_to_first_approval_hours: { p50: 3, p75: 10, n: 36 },
    created_to_merged_hours: { p50: 20, p75: 50, n: 40 },
    repositories: [],
  },
  'plugin://agile-analytics/collaboration': {
    as_of: '2026-10-29',
    window_start: '2024-10-29',
    inactive_days: 90,
    people: [
      { id: 1, name: 'Ann', active: true },
      { id: 2, name: 'Bob', active: false },
    ],
    repositories: [
      {
        repository: 'acme/legacy',
        status: 'orphaned',
        bus_factor: 0,
        teams: [],
        owners: [{ person_id: 2, name: 'Bob', share: 1, active: false }],
      },
    ],
    teams: [],
  },
  'plugin://agile-analytics/kudos': {
    total: 20,
    givers: 4,
    receivers: 5,
    people: 10,
    distribution: [12, 2, 2, 2, 2],
  },
  'plugin://agile-analytics/trends': {
    node: null,
    repositories: ['acme/api', 'acme/web'],
    single_repository: false,
    bucket: 'week',
    buckets: Array.from({ length: 9 }, (_, i) => ({
      start: START + i * 7 * DAY,
      days: 7,
      partial: i === 8,
      merged: 10,
      ai_assisted: i < 4 ? 2 : 6,
      not_ai_assisted: i < 4 ? 8 : 4,
      unattributed: 0,
      ai_share: i < 4 ? 0.2 : 0.6,
      deployments: i < 4 ? 7 : 14,
      failed_deployments: 0,
      deployment_frequency: i < 4 ? 1 : 2,
      change_failure_rate: 0,
      lead_time_for_changes: 7200,
    })),
  },
  'plugin://agile-analytics/sprints': {
    timestamp: '2026-10-30T05:00:00+00:00',
    flow: {
      items: 42,
      young_days: 10,
      young_share: 61.9,
      oldest_days: 120,
      median_days: 6,
      buckets: [
        { id: 'under_2', count: 10 },
        { id: 'over_30', count: 7 },
      ],
      oldest: [
        {
          key: 'ACME-1',
          summary: 'Old migration',
          status: 'In Review',
          age_days: 120,
          url: 'https://jira.example/browse/ACME-1',
        },
      ],
      stale_days: 30,
      stale: [],
      abandoned_days: 180,
      abandoned: 3,
    },
    predictability: {
      score: 78.4,
      lookback_days: 90,
      sprints_per_board: 3,
      min_sprints: 3,
      sprints: [
        {
          board_id: 1,
          board: 'Team A',
          sprint_id: 42,
          name: 'Sprint 42',
          start: '2026-10-01T08:00:00+00:00',
          end: '2026-10-14T16:00:00+00:00',
          committed: 20,
          completed: 16,
          added: 4,
          added_completed: 3,
          predictability: 80,
        },
      ],
    },
  },
  'plugin://agile-analytics/hours': {
    timestamp: '2026-10-30T05:00:00+00:00',
    metrics: [
      { id: 1, project: 'Backstage', hours: 120, percentage: 35.5, trend: 12 },
    ],
  },
  'plugin://agile-analytics/slos/budgets': [
    {
      service: 'API',
      slo_name: 'Availability',
      slo_target: 0.995,
      data: [
        [START, 10],
        [START + DAY, -12.5],
      ],
      history: [
        { start: START, end: START + 7 * DAY, remaining: 5, reports: 7 },
      ],
    },
  ],
  'plugin://agile-analytics/slos': {
    metrics: [
      {
        id: 1,
        sloName: 'Availability',
        service: 'API',
        sloValue: 99.2,
        sloTarget: 0.995,
        errorBudget: -12.5,
      },
      {
        id: 2,
        sloName: 'Latency',
        service: 'web',
        sloValue: 99.9,
        sloTarget: 0.99,
        errorBudget: 80,
      },
    ],
  },
};

function renderAt(path: string) {
  return renderInTestApp(<AgileAnalyticsRoot />, {
    initialRouteEntries: [path],
    apis: [
      [
        fetchApiRef,
        {
          // Matched without the query, which only says which period to load
          fetch: async (url: RequestInfo | URL) =>
            new Response(JSON.stringify(responses[String(url).split('?')[0]]), {
              status: 200,
            }),
        },
      ],
    ],
  });
}

describe('AgileAnalyticsRoot', () => {
  it('has a tab per area that keeps the team and period', async () => {
    await renderAt('/?team=t1&days=30');

    for (const [name, path] of [
      ['Overview', '/'],
      ['DORA', '/dora'],
      ['Error budgets', '/error-budgets'],
      ['AI adoption', '/ai'],
      ['Collaboration', '/collaboration'],
      ['Sprints & hours', '/sprints'],
      ['Trends', '/trends'],
    ]) {
      expect(await screen.findByRole('tab', { name })).toHaveAttribute(
        'href',
        `${path}?team=t1&days=30`,
      );
    }
  });

  it('shows the DORA summary on the overview', async () => {
    await renderAt('/');

    expect(
      await screen.findByRole('group', {
        name: 'Deployment frequency: 1.5 / day',
      }),
    ).toHaveTextContent('Elite performer · Improved');
    expect(
      screen.getByRole('group', { name: 'Change failure rate: 20%' }),
    ).toHaveTextContent('High performer · Got worse');
  });

  it('shows the DORA metrics and what needed a fix', async () => {
    await renderAt('/dora');

    expect(
      await screen.findByRole('group', { name: 'Change failure rate: 50%' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Time to restore: 30 min' }),
    ).toHaveTextContent('Elite performer');
    expect(screen.getByText(/fixed by Revert the cache/)).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: 'DORA metrics per repository' }),
    ).toHaveTextContent('acme/api');
  });

  it('shows the AI adoption and its impact', async () => {
    await renderAt('/ai');

    expect(
      await screen.findByRole('group', { name: 'AI adoption: 75%' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Faster with AI')).toBeInTheDocument();
    expect(screen.getByText('Faster builds')).toBeInTheDocument();
    expect(
      await screen.findByText(/Add your AI tool spend/),
    ).toBeInTheDocument();
  });

  it('shows code review and repositories that need an owner', async () => {
    await renderAt('/collaboration');

    expect(
      await screen.findByRole('group', {
        name: 'Merged without approval: 10%',
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('group', { name: 'People active: 1 / 2' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: 'Repositories that need an owner' }),
    ).toHaveTextContent('acme/legacyOrphaned0Bob (100%, inactive)');
  });

  it('shows how widely kudos are shared', async () => {
    await renderAt('/collaboration');

    expect(
      await screen.findByRole('group', { name: 'People thanked: 5' }),
    ).toHaveTextContent('50% of 10 people');
    expect(
      screen.getByRole('group', {
        name: 'Kudos to the most thanked fifth: 60%',
      }),
    ).toBeInTheDocument();
  });

  it('shows sprint predictability, flow and hours', async () => {
    await renderAt('/sprints');

    expect(
      await screen.findByRole('group', { name: 'Predictability: 78.4%' }),
    ).toHaveTextContent('Mean over 1 sprint');
    expect(
      screen.getByRole('group', { name: 'Flowing work: 61.9%' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Sprints' })).toHaveTextContent(
      'Sprint 42Team A20164 (3 done)80%',
    );
    expect(screen.getByRole('link', { name: 'ACME-1' })).toHaveAttribute(
      'href',
      'https://jira.example/browse/ACME-1',
    );
    expect(
      await screen.findByRole('table', { name: 'Hours per project' }),
    ).toHaveTextContent('Backstage12035.5%+12 h');
  });

  it('compares the latest weeks with the ones before', async () => {
    await renderAt('/trends');

    expect(
      await screen.findByRole('group', {
        name: 'Deployment frequency: 2 / day',
      }),
    ).toHaveTextContent('Up 100%');
    expect(
      screen.getByRole('group', { name: 'AI assisted merged work: 60%' }),
    ).toHaveTextContent('Up 200%');
    expect(
      screen.getByRole('group', { name: 'Lead time for changes: 2 h' }),
    ).toHaveTextContent('Unchanged');
  });

  it('links the overview to the insights and the overview', async () => {
    await renderAt('/');

    expect(
      await screen.findByRole('link', { name: 'Insights' }),
    ).toHaveAttribute('href', 'https://www.prod.agileanalytics.cloud/insights');
    expect(
      screen.getByRole('link', { name: 'Open in Agile Analytics' }),
    ).toHaveAttribute('href', 'https://www.prod.agileanalytics.cloud/overview');
  });

  it('shows the error budgets, lowest first', async () => {
    await renderAt('/error-budgets');

    expect(
      await screen.findByLabelText('1 of 2 SLOs on target'),
    ).toBeInTheDocument();
    expect(screen.getByText('1 over budget')).toBeInTheDocument();
    expect(
      await screen.findByRole('img', {
        name: 'Error budget of Availability over time, from 10% to -12.5%',
      }),
    ).toBeInTheDocument();
    const names = screen
      .getAllByText(/^(Availability|Latency)$/)
      .map(el => el.textContent);
    expect(names).toEqual(['Availability', 'Latency']);
    expect(screen.getByRole('link', { name: 'API' })).toHaveAttribute(
      'href',
      'https://www.prod.agileanalytics.cloud/error-budgets#api',
    );
    expect(screen.getByRole('link', { name: 'Manage SLOs' })).toHaveAttribute(
      'href',
      'https://www.prod.agileanalytics.cloud/settings/error-budgets',
    );
  });
});
