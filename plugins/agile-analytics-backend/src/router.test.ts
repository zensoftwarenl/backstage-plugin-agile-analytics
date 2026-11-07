import { CacheService } from '@backstage/backend-plugin-api';
import { mockErrorHandler, mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';
import { AgileAnalyticsClient } from './AgileAnalyticsClient';
import { createRouter } from './router';

function memoryCache(): CacheService {
  const store = new Map<string, any>();
  return {
    get: async key => store.get(key),
    set: async (key, value) => {
      store.set(key, value);
    },
    delete: async key => {
      store.delete(key);
    },
    withOptions: () => memoryCache(),
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('agile-analytics backend', () => {
  const fetchMock = jest.spyOn(global, 'fetch');
  let app: express.Express;

  async function createApp(authHeader?: 'api-key' | 'bearer' | 'legacy') {
    const client = AgileAnalyticsClient.fromConfig(
      mockServices.rootConfig({
        data: {
          agileAnalytics: { orgHash: 'ORG1', apiKey: 'secret-key', authHeader },
        },
      }),
      { cache: memoryCache(), logger: mockServices.logger.mock() },
    );
    app = express();
    app.use(await createRouter({ client }));
    app.use(mockErrorHandler());
  }

  beforeEach(() => fetchMock.mockReset());

  it('fetches the health report with a bearer key', async () => {
    await createApp('bearer');
    const report = { metrics: [{ id: 'delivery', score: 80, status: 1 }] };
    fetchMock.mockResolvedValue(jsonResponse(report));

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(report);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.prod.agileanalytics.cloud/ORG1/overview/',
      { headers: { Authorization: 'Bearer secret-key' } },
    );
  });

  it.each([undefined, 'api-key', 'legacy'] as const)(
    'sends the base64 Api-Key header with authHeader %s',
    async authHeader => {
      await createApp(authHeader);
      fetchMock.mockResolvedValue(jsonResponse([]));

      await request(app).get('/teams');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.prod.agileanalytics.cloud/ORG1/teams/',
        {
          headers: {
            'Api-Key': Buffer.from('secret-key').toString('base64'),
          },
        },
      );
    },
  );

  it('rejects an unknown authHeader', () => {
    expect(() =>
      AgileAnalyticsClient.fromConfig(
        mockServices.rootConfig({
          data: {
            agileAnalytics: { orgHash: 'O', apiKey: 'k', authHeader: 'basic' },
          },
        }),
        { cache: memoryCache(), logger: mockServices.logger.mock() },
      ),
    ).toThrow("must be 'api-key' or 'bearer', got 'basic'");
  });

  it('serves repeated requests from the cache', async () => {
    await createApp();
    fetchMock.mockResolvedValue(jsonResponse({ metrics: [] }));

    await request(app).get('/health');
    await request(app).get('/health');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches team health for a valid team hash', async () => {
    await createApp();
    fetchMock.mockResolvedValue(jsonResponse({ metrics: [] }));

    const response = await request(app).get('/teams/abc_123/health');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.prod.agileanalytics.cloud/ORG1/teams/abc_123/health/',
      expect.anything(),
    );
  });

  it('fetches the SLO report', async () => {
    await createApp();
    const report = {
      metrics: [{ id: 1, sloName: 'Availability', errorBudget: 42 }],
    };
    fetchMock.mockResolvedValue(jsonResponse(report));

    const response = await request(app).get('/slos');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(report);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.prod.agileanalytics.cloud/ORG1/overview/slo/',
      expect.anything(),
    );
  });

  it('rejects team hashes that could change the upstream path', async () => {
    await createApp();

    const response = await request(app).get('/teams/..%2Fsettings/health');

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not pass a rejected key through as an auth error', async () => {
    await createApp();
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'nope' }, 401));

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body.error.message).toContain('rejected the API key');
    expect(JSON.stringify(response.body)).not.toContain('secret-key');
  });

  it('answers null when Agile Analytics has no data yet', async () => {
    await createApp();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const response = await request(app).get('/dora/summary');

    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('combines the DORA data of a team for a whole-day period', async () => {
    jest.useFakeTimers({
      now: Date.UTC(2026, 9, 29, 15, 30),
      doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
    });
    await createApp();
    fetchMock.mockImplementation(async url =>
      String(url).includes('deployment_frequency')
        ? jsonResponse([
            {
              repository: 'acme/api',
              timestamp: 1,
              production: true,
              user: 'someone',
            },
          ])
        : new Response(null, { status: 204 }),
    );

    const response = await request(app).get('/dora?days=7&team=t1');
    jest.useRealTimers();

    expect(response.status).toBe(200);
    // 23 Oct 00:00 to 30 Oct 00:00 UTC
    const query = 'date_start=1792713600&date_end=1793318400';
    expect(response.body).toEqual({
      period: { start: 1792713600, end: 1793318400 },
      team: 't1',
      deployments: [{ repository: 'acme/api', timestamp: 1, production: true }],
      leadTimes: [],
      failures: [],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.prod.agileanalytics.cloud/ORG1/dora/deployment_frequency/t1?${query}`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.prod.agileanalytics.cloud/ORG1/dora/lead_time/?${query}`,
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.prod.agileanalytics.cloud/ORG1/dora/failed_deployments/?${query}`,
      expect.anything(),
    );
  });

  it('only accepts the periods the frontend offers', async () => {
    await createApp();

    const response = await request(app).get('/ai/adoption?days=3650');

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects team hashes in query parameters that could change the path', async () => {
    await createApp();

    const response = await request(app).get('/reviews?team=..%2Fsettings');

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('drops merge request descriptions from the AI adoption', async () => {
    await createApp();
    fetchMock.mockResolvedValue(
      jsonResponse({
        total: 1,
        attributed: 1,
        ai_assisted: 1,
        not_ai_assisted: 0,
        unattributed: 0,
        coverage: 1,
        adoption_rate: 1,
        merge_requests: [
          {
            repository: 'acme/api',
            title: 'Add things',
            ai_assisted: true,
            description: 'internal details',
          },
        ],
      }),
    );

    const response = await request(app).get('/ai/adoption?days=30');

    expect(response.status).toBe(200);
    expect(response.body.merge_requests).toEqual([
      { repository: 'acme/api', title: 'Add things', ai_assisted: true },
    ]);
  });

  it('asks for weekly error budget history', async () => {
    await createApp();
    fetchMock.mockResolvedValue(jsonResponse([]));

    await request(app).get('/slos/budgets');

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe('/ORG1/slo/error_budgets/');
    expect(url.searchParams.get('step_size')).toBe('24 hours');
    expect(url.searchParams.get('history')?.split(',')).toHaveLength(5);
  });

  it('fetches collaboration over an allowed window only', async () => {
    await createApp();
    fetchMock.mockResolvedValue(
      jsonResponse({
        as_of: '2026-10-29',
        window_start: '2025-10-29',
        people: [],
        repositories: [],
        teams: [],
        links: [{ person_id: 1, repository: 'acme/api', weight: 3 }],
        ties: [],
      }),
    );

    const ok = await request(app).get('/collaboration?windowDays=365');
    const bad = await request(app).get('/collaboration?windowDays=5');

    expect(ok.status).toBe(200);
    expect(ok.body.links).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.prod.agileanalytics.cloud/ORG1/collaboration/?window_days=365',
      expect.anything(),
    );
    expect(bad.status).toBe(400);
  });

  it('fetches trends for a repository over whole weeks', async () => {
    await createApp();
    fetchMock.mockResolvedValue(
      jsonResponse({
        node: 'acme/api',
        bucket: 'week',
        buckets: [{ start: 1, ai_share: 0.5, cohorts: { ai: { n: 3 } } }],
      }),
    );

    const ok = await request(app).get('/trends?days=182&node=Acme/API');
    const badNode = await request(app).get('/trends?node=acme/../settings');
    const badDays = await request(app).get('/trends?days=30');

    expect(ok.status).toBe(200);
    expect(ok.body.buckets).toEqual([{ start: 1, ai_share: 0.5 }]);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe('/ORG1/ai_impact/dora_over_time/');
    expect(url.searchParams.get('node')).toBe('acme/api');
    const days =
      (Number(url.searchParams.get('date_end')) -
        Number(url.searchParams.get('date_start'))) /
      86_400;
    expect(days).toBe(182);
    expect(badNode.status).toBe(400);
    expect(badDays.status).toBe(400);
  });

  it('counts kudos without passing on who gave them or the messages', async () => {
    await createApp();
    fetchMock.mockImplementation(async url =>
      String(url).includes('leaderboard')
        ? jsonResponse({
            total_kudos: 9,
            team_members_list: [
              { hash: 'U1', emoji_quantity: 2 },
              { hash: 'U2', emoji_quantity: 7 },
              { hash: 'U3', emoji_quantity: 0 },
            ],
            last_kudo: { from: 'U2', to: 'U1', message: 'thanks!' },
          })
        : jsonResponse([
            ['U1', 'U2 ', 7],
            ['U3', 'U1 ', 1],
            ['U3', 'U1 ', 1],
          ]),
    );

    const response = await request(app).get('/kudos?days=30&team=t1');

    expect(response.body).toEqual({
      total: 9,
      givers: 2,
      receivers: 2,
      people: 3,
      distribution: [7, 2],
    });
    expect(JSON.stringify(response.body)).not.toMatch(/U1|thanks/);
    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe(
      '/ORG1/kudos/teams/t1/leaderboard/',
    );
  });

  it('names who gave kudos to whom, without their e-mail addresses', async () => {
    await createApp();
    fetchMock.mockImplementation(async url =>
      String(url).includes('settings/users')
        ? jsonResponse([
            { hash: 'U1', user_name: 'Ada', email: 'ada@example.com' },
            { hash: 'U2', user_name: 'Linus', email: 'linus@example.com' },
          ])
        : jsonResponse([
            ['U1', 'U2 ', 7],
            ['U3', 'U1 ', 1],
            ['U2', 'U1', 0],
          ]),
    );

    const response = await request(app).get('/kudos/flows?days=30&team=t1');

    expect(response.body).toEqual({
      flows: [
        { from: 'Ada', to: 'Linus', kudos: 7 },
        // A hash without a known user keeps its hash
        { from: 'U3', to: 'Ada', kudos: 1 },
      ],
    });
    expect(JSON.stringify(response.body)).not.toMatch(/example\.com/);
    expect(
      fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname),
    ).toEqual([
      '/ORG1/kudos/teams/t1/sankey_diagram/',
      '/ORG1/settings/users/',
    ]);
  });

  it('passes the sprint report and hours through', async () => {
    await createApp();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const sprints = await request(app).get('/sprints');
    const hours = await request(app).get('/hours');

    expect(sprints.body).toBeNull();
    expect(hours.body).toBeNull();
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      'https://api.prod.agileanalytics.cloud/ORG1/overview/sprints/',
      'https://api.prod.agileanalytics.cloud/ORG1/overview/hours-investment/',
    ]);
  });

  it('adds up the Sprint Insights pages and keeps the tickets back', async () => {
    await createApp();
    const tickets = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        key: `ACME-${i}`,
        summary: 'Secret plans',
        assignee: 'ada@example.com',
      }));
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          features: 300,
          not_features: 200,
          tickets: tickets(500),
          time_split: { feature: 40.5, 'not feature': 10 },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          features: 2,
          not_features: 1,
          tickets: tickets(3),
          time_split: { feature: 1.5 },
        }),
      );

    const response = await request(app).get('/sprints/tickets?days=30&team=t1');

    expect(response.body).toEqual({
      features: 302,
      notFeatures: 201,
      featureHours: 42,
      notFeatureHours: 10,
      truncated: false,
    });
    expect(JSON.stringify(response.body)).not.toMatch(/Secret|example/);
    const urls = fetchMock.mock.calls.map(([url]) => new URL(String(url)));
    expect(urls.map(url => url.pathname)).toEqual([
      '/ORG1/si/t1/',
      '/ORG1/si/t1/',
    ]);
    expect(urls.map(url => url.searchParams.get('offset'))).toEqual([
      '0',
      '500',
    ]);
  });

  it('ranks people by AI-assisted work without their merge requests', async () => {
    await createApp();
    fetchMock.mockResolvedValue(
      jsonResponse({
        enabled: true,
        vampire_share: 0.9,
        people: [
          {
            rank: 1,
            name: 'Ada',
            user_hash: 'U1',
            ai_assisted: 4,
            merge_requests: 5,
            share: 0.8,
            merged: [{ title: 'Secret plans', url: 'https://example.com' }],
          },
        ],
      }),
    );

    const response = await request(app).get('/ai/leaderboard?days=14');

    expect(response.body).toEqual({
      enabled: true,
      people: [
        { rank: 1, name: 'Ada', ai_assisted: 4, merge_requests: 5, share: 0.8 },
      ],
    });
  });

  it('compares the teams by their scores only', async () => {
    await createApp();
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          team: { hash: 't1', name: 'Core', members: 4, services: 2 },
          total: 70,
          pillars: { dev: 80, ops: 60, agile: null },
          metrics: [{ id: 'kudos', score: 80 }],
          previous: { total: 65, pillars: { dev: 70 }, metrics: [] },
        },
      ]),
    );

    const response = await request(app).get('/teams/health?days=30');

    expect(response.body).toEqual([
      {
        team: { hash: 't1', name: 'Core', members: 4 },
        total: 70,
        pillars: { dev: 80, ops: 60, agile: null },
        previous: { total: 65, pillars: { dev: 70 } },
      },
    ]);
    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe(
      '/ORG1/teams/health/',
    );
  });

  it('lists the insights without who changed them', async () => {
    await createApp();
    fetchMock.mockResolvedValue(
      jsonResponse({
        insights: [
          {
            id: 7,
            area: 'delivery',
            priority: 'must',
            status: 'new',
            text: { en: 'Deploy more often' },
            last_seen_at: '2026-11-06',
            in_latest_report: true,
            team_hash: null,
            history: [{ by: 'ada@example.com', status: 'new' }],
            jira_issue: {
              key: 'ACME-1',
              url: 'https://jira/ACME-1',
              assignee: 'ada@example.com',
            },
          },
        ],
        jira: { connected: true },
      }),
    );

    const response = await request(app).get('/insights');

    expect(response.body).toEqual([
      {
        id: 7,
        area: 'delivery',
        priority: 'must',
        status: 'new',
        text: { en: 'Deploy more often' },
        last_seen_at: '2026-11-06',
        in_latest_report: true,
        team_hash: null,
        jira_issue: { key: 'ACME-1', url: 'https://jira/ACME-1' },
      },
    ]);
  });

  it('does not expose other Agile Analytics endpoints', async () => {
    await createApp();

    const response = await request(app).get('/settings/api_keys');

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
