import {
  CacheService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { NotFoundError, ServiceUnavailableError } from '@backstage/errors';
import type { JsonValue } from '@backstage/types';
import type {
  AiAdoption,
  AiCost,
  AiLeaderboard,
  AiDelivery,
  AiQuality,
  AiReturn,
  CiQueue,
  Collaboration,
  Deployment,
  DoraOverview,
  ErrorBudgetSeries,
  FailedDeployment,
  HealthReport,
  HoursInvestment,
  Insight,
  KudosFlows,
  KudosSummary,
  LeadTime,
  Organisation,
  Period,
  ReviewSummary,
  Signal,
  SloReport,
  SprintReport,
  Team,
  TeamComparisonRow,
  TicketSplit,
  Trends,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { weekBoundaries } from './period';

const DEFAULT_BASE_URL = 'https://api.prod.agileanalytics.cloud';
const DEFAULT_CACHE_TTL_MINUTES = 15;
// Sprint Insights tickets are read in pages, up to this many
const TICKET_PAGE_SIZE = 500;
const TICKET_PAGES = 10;

type Query = Record<string, string | number | undefined>;

/**
 * What the router needs of a client: the public methods of
 * {@link AgileAnalyticsClient}, also served by the demo client.
 */
export type AgileAnalyticsReader = Pick<
  AgileAnalyticsClient,
  keyof AgileAnalyticsClient
>;

/**
 * Talks to the Agile Analytics API with the organisation's API key, which
 * never leaves the backend. Responses are cached because Agile Analytics
 * refreshes its reports nightly.
 *
 * Agile Analytics answers 204 without a body when it has no data; those
 * calls resolve to null.
 */
export class AgileAnalyticsClient {
  static fromConfig(
    config: RootConfigService,
    deps: { cache: CacheService; logger: LoggerService },
  ) {
    const configured =
      config.getOptionalString('agileAnalytics.authHeader') ?? 'api-key';
    // `legacy` is what plugin versions up to 1.x called the Api-Key header
    const authHeader = configured === 'legacy' ? 'api-key' : configured;
    if (authHeader !== 'api-key' && authHeader !== 'bearer') {
      throw new Error(
        `agileAnalytics.authHeader must be 'api-key' or 'bearer', got '${configured}'`,
      );
    }
    return new AgileAnalyticsClient({
      baseUrl: (
        config.getOptionalString('agileAnalytics.baseUrl') ?? DEFAULT_BASE_URL
      ).replace(/\/+$/, ''),
      orgHash: config.getString('agileAnalytics.orgHash'),
      apiKey: config.getString('agileAnalytics.apiKey'),
      authHeader,
      cacheTtlMs:
        (config.getOptionalNumber('agileAnalytics.cacheTtlMinutes') ??
          DEFAULT_CACHE_TTL_MINUTES) * 60_000,
      ...deps,
    });
  }

  constructor(
    private readonly options: {
      baseUrl: string;
      orgHash: string;
      apiKey: string;
      authHeader: 'api-key' | 'bearer';
      cacheTtlMs: number;
      cache: CacheService;
      logger: LoggerService;
    },
  ) {}

  getOrganisation(): Promise<Organisation> {
    return this.get('settings/organisations/');
  }

  getHealth(): Promise<HealthReport> {
    return this.get('overview/');
  }

  getTeamHealth(teamHash: string): Promise<HealthReport> {
    return this.get(`teams/${encodeURIComponent(teamHash)}/health/`);
  }

  getTeams(): Promise<Team[]> {
    return this.get('teams/');
  }

  /** The actionable insights to follow up, open and closed. */
  async getInsights(): Promise<Insight[]> {
    const body = await this.get<{ insights?: Insight[] } | null>(
      'insights/',
      {},
      slimInsights,
    );
    return body?.insights ?? [];
  }

  getSignals(): Promise<Signal[]> {
    return this.get('overview/signals/');
  }

  getSloReport(): Promise<SloReport> {
    return this.get('overview/slo/');
  }

  getDoraOverview(): Promise<DoraOverview | null> {
    return this.get('overview/dora/');
  }

  async getDeployments(period: Period, teamHash?: string) {
    const path = teamHash
      ? `dora/deployment_frequency/${encodeURIComponent(teamHash)}`
      : 'dora/deployment_frequency/';
    const deployments = await this.get<Deployment[] | null>(
      path,
      dates(period),
      slimDeployments,
    );
    return deployments ?? [];
  }

  async getLeadTimes(period: Period) {
    const leadTimes = await this.get<LeadTime[] | null>(
      'dora/lead_time/',
      dates(period),
    );
    return leadTimes ?? [];
  }

  async getFailedDeployments(period: Period) {
    const failures = await this.get<FailedDeployment[] | null>(
      'dora/failed_deployments/',
      dates(period),
    );
    return failures ?? [];
  }

  getAiAdoption(period: Period): Promise<AiAdoption | null> {
    return this.get('ai_impact/adoption/', dates(period), slimAdoption);
  }

  getAiDelivery(period: Period): Promise<AiDelivery | null> {
    return this.get('ai_impact/delivery/', dates(period), slimAiDelivery);
  }

  getAiQuality(period: Period): Promise<AiQuality | null> {
    return this.get('ai_impact/quality/', dates(period), slimAiQuality);
  }

  getAiCost(period: Period): Promise<AiCost | null> {
    return this.get('ai_impact/cost/', dates(period));
  }

  getAiReturn(period: Period): Promise<AiReturn | null> {
    return this.get('ai_impact/return/', dates(period));
  }

  getCollaboration(windowDays: number): Promise<Collaboration | null> {
    return this.get(
      'collaboration/',
      { window_days: windowDays },
      slimCollaboration,
    );
  }

  getReviewSummary(
    period: Period,
    teamHash?: string,
  ): Promise<ReviewSummary | null> {
    const path = teamHash
      ? `review/summary/${encodeURIComponent(teamHash)}`
      : 'review/summary/';
    return this.get(path, dates(period));
  }

  /**
   * DORA and AI adoption per week, or per day for up to 62 days, for the
   * organisation or a group or repository path such as `group/project`.
   */
  getTrends(period: Period, node?: string): Promise<Trends | null> {
    return this.get(
      'ai_impact/dora_over_time/',
      { ...dates(period), node },
      slimTrends,
    );
  }

  /** The nightly sprint report: flow of work in progress and predictability. */
  getSprintReport(): Promise<SprintReport | null> {
    return this.get('overview/sprints/');
  }

  /** Hours booked per project over the last two weeks. */
  getHoursInvestment(): Promise<HoursInvestment | null> {
    return this.get('overview/hours-investment/');
  }

  /**
   * How widely kudos were given in a period, for the organisation or the
   * members of a team. Who gave or got them, and the messages, stay here.
   */
  async getKudos(period: Period, teamHash?: string): Promise<KudosSummary> {
    const base = teamHash
      ? `kudos/teams/${encodeURIComponent(teamHash)}/`
      : 'kudos/';
    const [leaderboard, flows] = await Promise.all([
      this.get<{
        total_kudos?: number;
        team_members_list?: { hash: string; emoji_quantity: number }[];
      } | null>(`${base}leaderboard/`, dates(period), slimLeaderboard),
      this.get<[string, string, number][] | null>(
        `${base}sankey_diagram/`,
        dates(period),
      ),
    ]);
    const counts = (leaderboard?.team_members_list ?? []).map(
      member => member.emoji_quantity,
    );
    return {
      total: leaderboard?.total_kudos ?? 0,
      givers: new Set((flows ?? []).map(([from]) => from.trim())).size,
      receivers: counts.filter(count => count > 0).length,
      people: counts.length,
      distribution: counts.filter(count => count > 0).sort((a, b) => b - a),
    };
  }

  /**
   * Who gave kudos to whom in a period, by name, for the organisation or the
   * members of a team. A hash without a known user keeps its hash.
   */
  async getKudosFlows(period: Period, teamHash?: string): Promise<KudosFlows> {
    const base = teamHash
      ? `kudos/teams/${encodeURIComponent(teamHash)}/`
      : 'kudos/';
    const [flows, users] = await Promise.all([
      this.get<[string, string, number][] | null>(
        `${base}sankey_diagram/`,
        dates(period),
      ),
      this.get<{ hash: string; user_name?: string | null }[] | null>(
        'settings/users/',
        {},
        slimUsers,
      ),
    ]);
    const names = new Map(
      (users ?? []).map(user => [user.hash, user.user_name || user.hash]),
    );
    // The API pads some hashes with spaces
    const name = (hash: string) => names.get(hash.trim()) ?? hash.trim();
    return {
      flows: (flows ?? [])
        .filter(([, , kudos]) => kudos > 0)
        .map(([from, to, kudos]) => ({
          from: name(from),
          to: name(to),
          kudos,
        })),
    };
  }

  /** How long CI jobs waited for a runner, per day or week. */
  getCiQueue(period: Period): Promise<CiQueue | null> {
    return this.get('dora/ci_queue_time/', dates(period), slimCiQueue);
  }

  /** People ranked by their AI-assisted merged work, without the work. */
  getAiLeaderboard(period: Period): Promise<AiLeaderboard | null> {
    return this.get('ai_impact/leaderboard/', dates(period), slimAiLeaderboard);
  }

  /**
   * Tickets done in a period, features against other work, for the
   * organisation or a team. Agile Analytics counts per page of tickets, so
   * the pages are added up; the tickets themselves stay here.
   */
  async getTicketSplit(
    period: Period,
    teamHash?: string,
  ): Promise<TicketSplit> {
    const path = teamHash ? `si/${encodeURIComponent(teamHash)}/` : 'si/';
    const split: TicketSplit = {
      features: 0,
      notFeatures: 0,
      featureHours: 0,
      notFeatureHours: 0,
      truncated: false,
    };
    for (let page = 0; page < TICKET_PAGES; page++) {
      const body = await this.get<{
        features?: number;
        not_features?: number;
        feature_hours?: number;
        not_feature_hours?: number;
        tickets?: number;
      } | null>(
        path,
        {
          ...dates(period),
          limit: TICKET_PAGE_SIZE,
          offset: page * TICKET_PAGE_SIZE,
        },
        slimTicketPage,
      );
      if (!body) break;
      split.features += body.features ?? 0;
      split.notFeatures += body.not_features ?? 0;
      split.featureHours += body.feature_hours ?? 0;
      split.notFeatureHours += body.not_feature_hours ?? 0;
      if ((body.tickets ?? 0) < TICKET_PAGE_SIZE) return split;
    }
    split.truncated = true;
    return split;
  }

  /** Every team's health over a period, next to the period before. */
  async getTeamComparison(period: Period): Promise<TeamComparisonRow[]> {
    const rows = await this.get<TeamComparisonRow[] | null>(
      'teams/health/',
      dates(period),
      slimTeamComparison,
    );
    return rows ?? [];
  }

  async getErrorBudgets(period: Period, now = Date.now()) {
    const budgets = await this.get<ErrorBudgetSeries[] | null>(
      'slo/error_budgets/',
      {
        ...dates(period),
        step_size: '24 hours',
        // The average budget left per week over the last four weeks, like the
        // error budgets page of Agile Analytics
        history: weekBoundaries(now).join(','),
      },
    );
    return budgets ?? [];
  }

  private async get<T>(
    path: string,
    query: Query = {},
    slim: (body: any) => JsonValue = body => body,
  ): Promise<T> {
    const { baseUrl, orgHash, cache, cacheTtlMs, logger } = this.options;
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) search.set(key, String(value));
    }
    const queryString = search.toString();
    const pathAndQuery = queryString ? `${path}?${queryString}` : path;
    const cacheKey = `aa:${orgHash}:${pathAndQuery}`;
    const cached = await cache.get(cacheKey);
    if (cached !== undefined) {
      return cached as T;
    }

    const url = `${baseUrl}/${encodeURIComponent(orgHash)}/${pathAndQuery}`;
    let response: Response;
    try {
      response = await fetch(url, { headers: this.headers() });
    } catch (error) {
      throw new ServiceUnavailableError(
        `Could not reach Agile Analytics: ${error}`,
      );
    }

    if (response.status === 404) {
      throw new NotFoundError(`Agile Analytics has no data at ${path}`);
    }
    if (!response.ok) {
      // Log the details but don't pass upstream bodies on to the browser
      logger.warn(
        `Agile Analytics request ${path} failed with ${response.status} ${response.statusText}`,
      );
      if (response.status === 401 || response.status === 403) {
        throw new ServiceUnavailableError(
          'Agile Analytics rejected the API key, check agileAnalytics.apiKey and agileAnalytics.authHeader',
        );
      }
      throw new ServiceUnavailableError(
        `Agile Analytics responded with ${response.status}`,
      );
    }

    // No data yet
    const text = response.status === 204 ? '' : await response.text();
    const body = text ? slim(JSON.parse(text) as JsonValue) : null;
    await cache.set(cacheKey, body, { ttl: cacheTtlMs });
    return body as T;
  }

  private headers(): Record<string, string> {
    const { apiKey, authHeader } = this.options;
    if (authHeader === 'api-key') {
      return { 'Api-Key': Buffer.from(apiKey).toString('base64') };
    }
    return { Authorization: `Bearer ${apiKey}` };
  }
}

function dates(period: Period): Query {
  return { date_start: period.start, date_end: period.end };
}

function pick<T extends object, K extends keyof T>(
  object: T,
  keys: K[],
): Pick<T, K> {
  const picked = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in object) picked[key] = object[key];
  }
  return picked;
}

// The upstream responses carry trees, graphs and descriptions the plugin does
// not show. Dropping them keeps the cache and the browser payload small, and
// keeps merge request descriptions out of Backstage.

function slimDeployments(body: any) {
  return Array.isArray(body)
    ? body.map(deployment =>
        pick(deployment, [
          'repository',
          'environment',
          'status',
          'timestamp',
          'production',
          'production_attempt',
        ]),
      )
    : body;
}

function slimAdoption(body: any) {
  if (!body || typeof body !== 'object') return body;
  return {
    ...pick(body, [
      'total',
      'attributed',
      'ai_assisted',
      'not_ai_assisted',
      'unattributed',
      'coverage',
      'adoption_rate',
      'commits',
    ]),
    merge_requests: (Array.isArray(body.merge_requests)
      ? body.merge_requests
      : []
    ).map((mr: object) =>
      pick(mr as any, [
        'repository',
        'iid',
        'title',
        'author',
        'merged_date',
        'ai_assisted',
        'ai_signal',
        'ai_tool',
        'lines_added',
        'lines_removed',
      ]),
    ),
  };
}

function slimTrends(body: any) {
  if (!body || typeof body !== 'object') return body;
  return {
    ...pick(body, ['node', 'repositories', 'single_repository', 'bucket']),
    buckets: (body.buckets ?? []).map((bucket: any) =>
      pick(bucket, [
        'start',
        'days',
        'partial',
        'merged',
        'ai_assisted',
        'not_ai_assisted',
        'unattributed',
        'ai_share',
        'deployments',
        'failed_deployments',
        'deployment_frequency',
        'change_failure_rate',
        'lead_time_for_changes',
        'lead_time_for_changes_n',
      ]),
    ),
  };
}

// The last kudo carries a Slack message; only the counts are kept
function slimLeaderboard(body: any) {
  if (!body || typeof body !== 'object') return body;
  return pick(body, ['total_kudos', 'team_members_list']);
}

// Only who is who: users come with their e-mail address and settings
function slimUsers(body: any) {
  if (!Array.isArray(body)) return body;
  return body.map((user: any) => pick(user, ['hash', 'user_name']));
}

function slimAiDelivery(body: any) {
  if (!body || typeof body !== 'object') return body;
  return pick(body, ['metrics', 'unattributed', 'min_cohort_size']);
}

function slimAiQuality(body: any) {
  if (!body || typeof body !== 'object') return body;
  return {
    ...pick(body, ['cohorts', 'threshold']),
    ...(body.rework
      ? { rework: pick(body.rework, ['window_days', 'cohorts']) }
      : {}),
  };
}

function slimCollaboration(body: any) {
  if (!body || typeof body !== 'object') return body;
  return {
    ...pick(body, [
      'as_of',
      'window_start',
      'inactive_days',
      'repositories_without_team',
      'people_without_team',
    ]),
    people: (body.people ?? []).map((person: any) =>
      pick(person, [
        'id',
        'name',
        'display_name',
        'active',
        'last_active',
        'teams',
      ]),
    ),
    repositories: (body.repositories ?? []).map((repository: any) => ({
      ...pick(repository, [
        'repository',
        'status',
        'activity',
        'last_activity',
        'bus_factor',
        'teams',
      ]),
      owners: (repository.owners ?? []).map((owner: any) =>
        pick(owner, ['person_id', 'name', 'share', 'active']),
      ),
    })),
    teams: (body.teams ?? []).map((team: any) =>
      pick(team, [
        'hash',
        'name',
        'members',
        'repositories',
        'coverage',
        'focus',
      ]),
    ),
  };
}

function slimCiQueue(body: any) {
  if (!body || typeof body !== 'object') return body;
  return {
    ...pick(body, ['threshold_seconds']),
    ...(body.summary
      ? {
          summary: pick(body.summary, [
            'jobs',
            'p50',
            'p90',
            'waiting_jobs',
            'wait_seconds',
          ]),
        }
      : {}),
    series: (body.series ?? []).map((bucket: any) =>
      pick(bucket, ['start', 'p50', 'p90', 'waiting_jobs', 'jobs']),
    ),
  };
}

// Names and counts; the merge requests behind them carry titles and links
function slimAiLeaderboard(body: any) {
  if (!body || typeof body !== 'object') return body;
  return {
    ...pick(body, ['enabled']),
    people: (body.people ?? []).map((person: any) =>
      pick(person, [
        'rank',
        'name',
        'ai_assisted',
        'merge_requests',
        'share',
        'commits',
        'ai_commits',
        'main_tool',
        'vampire',
      ]),
    ),
  };
}

// Only the counts of a page of tickets: the tickets carry summaries and
// assignees
function slimTicketPage(body: any) {
  if (!body || typeof body !== 'object') return body;
  const split = body.time_split ?? {};
  return {
    features: body.features ?? 0,
    not_features: body.not_features ?? 0,
    feature_hours: split.feature ?? 0,
    not_feature_hours: split['not feature'] ?? 0,
    tickets: Array.isArray(body.tickets) ? body.tickets.length : 0,
  };
}

function slimTeamComparison(body: any) {
  if (!Array.isArray(body)) return body;
  const scores = (report: any) =>
    report && typeof report === 'object'
      ? { total: report.total ?? null, pillars: report.pillars ?? {} }
      : null;
  return body.map((row: any) => ({
    team: pick(row.team ?? {}, ['hash', 'name', 'members']),
    ...scores(row),
    previous: scores(row.previous),
  }));
}

// The insights without their history of who changed what
function slimInsights(body: any) {
  if (!body || typeof body !== 'object') return body;
  return {
    insights: (body.insights ?? []).map((insight: any) => ({
      ...pick(insight, [
        'id',
        'area',
        'priority',
        'status',
        'text',
        'last_seen_at',
        'in_latest_report',
        'team_hash',
      ]),
      jira_issue: insight.jira_issue
        ? pick(insight.jira_issue, ['key', 'url', 'status', 'done', 'summary'])
        : null,
    })),
  };
}
