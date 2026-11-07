/**
 * Types shared by the Agile Analytics frontend and backend plugins.
 *
 * The shapes follow the Agile Analytics API (api.prod.agileanalytics.cloud)
 * as used by the Agile Analytics web app. Fields we do not use yet are
 * left out on purpose; the backend passes them through unchanged.
 *
 * @packageDocumentation
 */

/**
 * The areas that make up the engineering health score.
 *
 * @public
 */
export type HealthAreaId =
  | 'delivery'
  | 'reliability'
  | 'flow'
  | 'execution'
  | 'investment'
  | 'ai'
  | 'collaboration'
  | 'kudos'
  | 'pulse';

/**
 * The three thirds the health score is averaged over.
 *
 * @public
 */
export type HealthPillarId = 'dev' | 'ops' | 'agile';

/**
 * Status of a health area: -1 action needed, 0 needs attention, 1 on track.
 *
 * @public
 */
export type HealthStatus = -1 | 0 | 1;

/**
 * A target set in Agile Analytics for one metric of an area.
 *
 * @public
 */
export type HealthTarget = {
  metric: string;
  met: boolean | null;
};

/**
 * One area of the health report.
 *
 * @public
 */
export type HealthMetric = {
  id: HealthAreaId | string;
  name?: string;
  description?: string;
  /** 0-100, or a number of days for the `flow` area. */
  score: number | null;
  status?: HealthStatus | null;
  /** Change since the previous report, in points (or days for `flow`). */
  trend?: number | null;
  /** Missing means available; false means not set up or nothing measured. */
  available?: boolean;
  /** What the area needs before it can be measured, e.g. `jira_board`. */
  needs?: string;
  targets?: HealthTarget[];
  // Area specific details
  adoption?: number | null;
  target?: number;
  slos?: number;
  within_budget?: number;
  workers?: number;
  respondents?: number;
  round_started_on?: string;
  sprints?: number;
  min_sprints?: number;
  oldest_days?: number | null;
  abandoned?: number;
};

/**
 * The health report for the organisation or a single team.
 *
 * @public
 */
export type HealthReport = {
  metrics: HealthMetric[];
};

/**
 * A team as known in Agile Analytics.
 *
 * @public
 */
export type Team = {
  team_hash: string;
  team_name: string;
};

/**
 * Something that moved in the latest report, e.g. a tier drop or a
 * recovered SLO.
 *
 * @public
 */
export type Signal = {
  kind: string;
  area?: HealthAreaId | string;
  metric?: string;
  before?: number | null;
  after?: number | null;
  value?: number | null;
  target?: number | null;
  service?: string;
  slo?: string;
  repository?: string;
  key?: string;
  age_days?: number;
  summary?: string;
  url?: string;
};

/**
 * One SLO from the nightly SLO report.
 *
 * @public
 */
export type SloReportMetric = {
  id: string | number;
  sloName?: string;
  service?: string | null;
  /** The measured value, in percent. */
  sloValue?: number | string | null;
  /** The target as a fraction, e.g. 0.995. */
  sloTarget?: number | string | null;
  /** Error budget left, in percent; negative when it is used up. */
  errorBudget?: number | string | null;
  /** The team that owns the service; `team_name` is ` - ` when unmatched. */
  team_hash?: string | null;
  team_name?: string | null;
};

/**
 * The last SLO report Agile Analytics made.
 *
 * @public
 */
export type SloReport = {
  timestamp?: string;
  metrics?: SloReportMetric[];
};

/**
 * Basic information about the organisation.
 *
 * @public
 */
export type Organisation = {
  org_hash: string;
  org_name: string;
  subscription_level?: string;
};

/**
 * Which third each area belongs to, as in the Agile Analytics web app.
 *
 * @public
 */
export const HEALTH_AREA_PILLARS: Record<HealthAreaId, HealthPillarId> = {
  ai: 'dev',
  collaboration: 'dev',
  kudos: 'dev',
  pulse: 'dev',
  delivery: 'ops',
  reliability: 'ops',
  flow: 'agile',
  execution: 'agile',
  investment: 'agile',
};

/**
 * The periods, in days, the tabs can be looked at over. Periods end at the
 * start of the next UTC day so responses stay cacheable for a day.
 *
 * @public
 */
export const PERIOD_DAYS = [7, 14, 30, 90] as const;

/**
 * A period in days, one of {@link PERIOD_DAYS}.
 *
 * @public
 */
export type PeriodDays = (typeof PERIOD_DAYS)[number];

/**
 * The period a response covers, in epoch seconds; `end` is exclusive.
 *
 * @public
 */
export type Period = {
  start: number;
  end: number;
};

/**
 * The windows, in days, repository ownership can be looked at over.
 *
 * @public
 */
export const COLLABORATION_WINDOWS = [365, 730, 1095] as const;

/**
 * One DORA metric of the nightly overview report.
 *
 * - `df`: production deployments per day
 * - `lt`: median lead time for changes, in seconds
 * - `mttr`: median time to restore, in hours
 * - `cfr`: change failure rate, in percent
 *
 * @public
 */
export type DoraOverviewMetric = {
  id: 'df' | 'lt' | 'mttr' | 'cfr';
  value: number | 'not available';
  /** 1 improved, -1 got worse, 0 unchanged; already inverted for lt, mttr and cfr. */
  trend: -1 | 0 | 1;
  change: number;
};

/**
 * The DORA metrics over the last 14 days, made every night.
 *
 * @public
 */
export type DoraOverview = {
  timestamp?: string;
  metrics?: DoraOverviewMetric[];
};

/**
 * A pipeline run that may have deployed to production.
 *
 * @public
 */
export type Deployment = {
  repository: string;
  environment?: string | null;
  status?: string;
  /** Epoch seconds. */
  timestamp: number;
  /** A successful production deployment. */
  production: boolean;
  /** Ran a production job; `production: false` then means it failed. */
  production_attempt?: boolean;
};

/**
 * How long one change took to reach production, all in seconds.
 *
 * @public
 */
export type LeadTime = {
  repository: string;
  /** Ticket created to deployed. */
  lead_time: number | null;
  /** Ticket started to deployed. */
  cycle_time: number | null;
  /** Merged to deployed. */
  lead_time_for_changes: number | null;
  /** Epoch seconds of the deployment. */
  timestamp: number;
  key?: string;
};

/**
 * A deployment that needed a fix, found from hotfixes, reverts and SLO alerts.
 *
 * @public
 */
export type FailedDeployment = {
  repository: string;
  environment?: string | null;
  /** Epoch seconds. */
  timestamp: number;
  /** Epoch seconds of the first fix in production. */
  restored_at: number | null;
  /** Seconds. */
  time_to_restore: number | null;
  remediations?: {
    source_branch: string;
    title: string | null;
    merged_date: number;
    deployment_date: number | null;
  }[];
  slo_alerts?: {
    service: string;
    feature?: string;
    slo_name: string;
    started: number;
    ended: number | null;
  }[];
};

/**
 * A merged merge request with whether AI helped write it. The backend drops
 * the descriptions and other fields the plugin does not show.
 *
 * @public
 */
export type AiMergeRequest = {
  repository: string;
  iid?: number | string | null;
  title?: string | null;
  author?: string | null;
  /** Epoch seconds. */
  merged_date?: number | null;
  /** Null when nothing says either way. */
  ai_assisted: boolean | null;
  ai_signal?: 'commit_trailer' | 'pr_label' | 'manual' | null;
  ai_tool?: string | null;
  lines_added?: number | null;
  lines_removed?: number | null;
};

/**
 * How much of the merged work AI helped with. Ratios are fractions.
 *
 * @public
 */
export type AiAdoption = {
  total: number;
  attributed: number;
  ai_assisted: number;
  not_ai_assisted: number;
  unattributed: number;
  /** attributed / total */
  coverage: number | null;
  /** ai_assisted / attributed */
  adoption_rate: number | null;
  merge_requests: AiMergeRequest[];
  commits?: {
    total: number;
    ai_assisted: number;
    adoption_rate: number | null;
    tools?: Record<string, number>;
  };
};

/**
 * Whether AI assisted work moves faster than other work, for one measure.
 *
 * @public
 */
export type AiVerdict = {
  repositories: number;
  ai_count: number;
  other_count: number;
  /** Seconds. */
  ai_typical: number | null;
  other_typical: number | null;
  /** Seconds; negative means faster with AI. */
  difference: number | null;
  interval?: [number, number] | null;
  /** Enough comparable work to draw a conclusion. */
  reliable: boolean;
};

/**
 * AI assisted versus other work on the way to production.
 *
 * @public
 */
export type AiDelivery = {
  metrics: {
    time_to_merge: AiVerdict;
    time_to_first_approval: AiVerdict;
    time_to_deploy: AiVerdict;
  };
  unattributed?: number;
  min_cohort_size?: number;
};

/**
 * Deployments and failures of a group of repositories.
 *
 * @public
 */
export type AiQualityCohort = {
  repositories: number;
  deployments: number;
  failed_deployments: number;
  /** Fraction. */
  change_failure_rate: number | null;
};

/**
 * Rework of the merged work of one cohort.
 *
 * @public
 */
export type AiReworkCohort = {
  merged: number;
  enough: boolean;
  reworked: number;
  /** Fraction. */
  rework_rate: number | null;
  reviewed?: number;
  changed_after_review?: number | null;
};

/**
 * Whether repositories with much AI assisted work fail more often.
 *
 * @public
 */
export type AiQuality = {
  cohorts: { high_ai: AiQualityCohort; low_ai: AiQualityCohort };
  /** The share of AI assisted work from which a repository counts as high AI. */
  threshold?: number;
  rework?: {
    window_days: number;
    cohorts: { ai: AiReworkCohort; other: AiReworkCohort };
  };
};

/**
 * What AI tools cost over the period.
 *
 * @public
 */
export type AiCost = {
  currency: string;
  configured: boolean;
  spend: number | null;
  ai_merge_requests: number;
  cost_per_ai_merge_request: number | null;
  tools?: {
    tool: string;
    configured: boolean;
    seats: number | null;
    spend: number | null;
    ai_merge_requests: number;
    active_authors: number;
    seat_use: number | null;
  }[];
};

/**
 * What AI tools return, from comparing people who use AI more and less.
 *
 * @public
 */
export type AiReturn = {
  currency: string;
  hourly_rate: number | null;
  ai_merge_requests: number;
  /** Only set when the measurement is reliable. */
  hours_saved: number | null;
  value: number | null;
  spend: number | null;
  net: number | null;
  return_ratio: number | null;
  measurement?: {
    people_compared: number;
    reliable: boolean;
    window?: { start: string; end: string };
  };
};

/**
 * How healthy a repository's ownership is.
 *
 * @public
 */
export type RepositoryStatus = 'orphaned' | 'at_risk' | 'dormant' | 'healthy';

/**
 * Who works on which repositories, and which ones nobody looks after. The
 * backend drops the person to person links the plugin does not draw.
 *
 * @public
 */
export type Collaboration = {
  as_of: string;
  window_start: string;
  inactive_days?: number;
  people: {
    id: number;
    name: string;
    display_name?: string | null;
    active: boolean;
    last_active?: string;
    teams?: string[];
  }[];
  repositories: {
    repository: string;
    status: RepositoryStatus;
    activity?: number;
    last_activity?: string | null;
    bus_factor: number;
    teams: string[];
    owners: {
      person_id: number;
      name: string;
      /** Fraction. */
      share: number;
      active: boolean;
    }[];
  }[];
  teams: {
    hash: string;
    name: string;
    members: number[];
    repositories: string[];
    /** Fraction of the team's repositories its members work on. */
    coverage: number | null;
    /** Fraction of the members' work spent on the team's repositories. */
    focus: number | null;
  }[];
  repositories_without_team?: string[];
  people_without_team?: number[];
};

/**
 * How merge requests were reviewed. Shares are fractions, times in hours.
 *
 * @public
 */
export type ReviewMetrics = {
  merged: number;
  approved: number;
  without_approval: number;
  unknown: number;
  without_approval_share: number | null;
  wait_to_first_approval_hours: {
    p50: number | null;
    p75: number | null;
    n: number;
  };
  created_to_merged_hours: {
    p50: number | null;
    p75: number | null;
    n: number;
  };
};

/**
 * Review metrics of the organisation or a team, and per repository.
 *
 * @public
 */
export type ReviewSummary = ReviewMetrics & {
  period?: { date_start: number; date_end: number };
  team?: string | null;
  repositories: (ReviewMetrics & { repository: string })[];
};

/**
 * One SLO's error budget over the period.
 *
 * @public
 */
export type ErrorBudgetSeries = {
  service: string;
  feature?: string;
  slo_name: string;
  slo_description?: string | null;
  /** Fraction, e.g. 0.999. */
  slo_target: number;
  /** [epoch seconds, budget left in percent, events]; the budget can be negative. */
  data: [number, number, { good_events: number; bad_events: number }?][];
  /** The average budget left per week, oldest first. */
  history?: {
    start: number;
    end: number;
    remaining: number | null;
    reports: number;
  }[];
};

/**
 * What the backend's `/dora` route returns: the raw DORA data of a period,
 * for the organisation or a team.
 *
 * Only deployments can be asked for per team; lead times and failures are
 * for the whole organisation and matched to the team's repositories by the
 * frontend.
 *
 * @public
 */
export type DoraData = {
  period: Period;
  team: string | null;
  deployments: Deployment[];
  leadTimes: LeadTime[];
  failures: FailedDeployment[];
};

/**
 * What the backend's `/ai/cost` route returns.
 *
 * @public
 */
export type AiCostAndReturn = {
  cost: AiCost | null;
  return: AiReturn | null;
};

/**
 * The periods, in days, the trends can cover. Agile Analytics buckets them
 * per week.
 *
 * @public
 */
export const TREND_DAYS = [91, 182, 364] as const;

/**
 * One week, or day for short periods, of DORA and AI adoption. Fractions are
 * 0..1 and durations in seconds.
 *
 * @public
 */
export type TrendBucket = {
  /** Epoch seconds. */
  start: number;
  days: number;
  partial: boolean;
  merged: number;
  ai_assisted: number;
  not_ai_assisted: number;
  unattributed: number;
  ai_share: number | null;
  deployments: number;
  failed_deployments: number;
  /** Production deployments per day. */
  deployment_frequency: number | null;
  change_failure_rate: number | null;
  /** Median, over merged work deployed in the bucket. */
  lead_time_for_changes: number | null;
  lead_time_for_changes_n?: number;
};

/**
 * DORA and AI adoption over time, for the organisation or a group or
 * repository.
 *
 * @public
 */
export type Trends = {
  node: string | null;
  repositories: string[];
  single_repository: boolean;
  bucket: 'day' | 'week';
  buckets: TrendBucket[];
};

/**
 * A sprint and how much of what was committed got done. Predictability is in
 * percent.
 *
 * @public
 */
export type SprintResult = {
  board_id: number;
  board: string;
  sprint_id: number;
  name: string;
  url?: string;
  /** ISO dates. */
  start: string;
  end: string;
  committed: number;
  completed: number;
  added: number;
  added_completed: number;
  predictability: number | null;
};

/**
 * A work item in progress, from Jira.
 *
 * @public
 */
export type FlowItem = {
  key: string;
  summary: string;
  status: string;
  type?: string;
  project?: string;
  age_days: number;
  url?: string;
};

/**
 * The nightly sprint report: how work in progress flows and how predictable
 * sprints are. Shares are in percent, ages in days.
 *
 * @public
 */
export type SprintReport = {
  timestamp: string;
  flow?: {
    items: number;
    young_days: number;
    young_share: number | null;
    oldest_days: number | null;
    median_days: number | null;
    buckets: { id: string; count: number }[];
    oldest: FlowItem[];
    stale_days: number;
    stale: FlowItem[];
    abandoned_days: number;
    abandoned: number;
  };
  predictability?: {
    score: number | null;
    lookback_days: number;
    sprints_per_board: number;
    min_sprints: number;
    sprints: SprintResult[];
  };
  teams?: Record<
    string,
    {
      items: number;
      young_days: number;
      young_share: number | null;
      oldest_days: number | null;
      abandoned: number;
    }
  >;
};

/**
 * Hours booked per project over the last two weeks. Percentages are 0..100,
 * trend is the change in hours since the report before.
 *
 * @public
 */
export type HoursInvestment = {
  timestamp: string;
  metrics: {
    id: number;
    project: string;
    hours: number;
    percentage: number;
    trend: number | null;
  }[];
};

/**
 * How widely kudos are given, without who gave or got them.
 *
 * @public
 */
export type KudosSummary = {
  total: number;
  givers: number;
  receivers: number;
  /** Team members, or for the organisation everyone known to Kudos. */
  people: number;
  /** Kudos per person who got any, most first, without who they are. */
  distribution: number[];
};

/**
 * Who gave kudos to whom in a period, as the Sankey diagram of the Kudos page
 * of Agile Analytics shows it. The messages stay in Agile Analytics.
 *
 * @public
 */
export type KudosFlows = {
  flows: {
    /** The name of who gave the kudos. */
    from: string;
    /** The name of who got them. */
    to: string;
    kudos: number;
  }[];
};

/**
 * How long CI jobs waited for a runner in a period, per day or week. Waits
 * are in seconds.
 *
 * @public
 */
export type CiQueue = {
  summary?: {
    jobs?: number;
    p50?: number | null;
    p90?: number | null;
    /** Jobs that waited longer than `threshold_seconds`. */
    waiting_jobs?: number;
    wait_seconds?: number | null;
  };
  series?: {
    /** Epoch seconds. */
    start: number;
    p50?: number | null;
    p90?: number | null;
    waiting_jobs?: number;
    jobs?: number;
  }[];
  threshold_seconds?: number;
};

/**
 * People ranked by the AI-assisted work they merged in a period. Their merge
 * requests stay in Agile Analytics.
 *
 * @public
 */
export type AiLeaderboard = {
  enabled?: boolean;
  people?: {
    rank: number;
    name: string;
    ai_assisted?: number;
    merge_requests?: number;
    /** Fraction of their merged work that was AI assisted. */
    share?: number | null;
    commits?: number;
    ai_commits?: number;
    main_tool?: string | null;
    /** Merges so much AI work that reviewers can hardly keep up. */
    vampire?: boolean;
  }[];
};

/**
 * Tickets done in a period split into features and other work, by count and
 * by hours booked, as the Sprint Insights pies of Agile Analytics.
 *
 * @public
 */
export type TicketSplit = {
  features: number;
  notFeatures: number;
  featureHours: number;
  notFeatureHours: number;
  /** More tickets than were counted. */
  truncated: boolean;
};

/**
 * A team's engineering health score and its thirds.
 *
 * @public
 */
export type TeamScores = {
  total: number | null;
  pillars: Partial<Record<HealthPillarId, number | null>>;
};

/**
 * Every team's health over a period next to the period before, to compare
 * the teams.
 *
 * @public
 */
export type TeamComparisonRow = TeamScores & {
  team: { hash: string; name: string; members?: number };
  previous: TeamScores | null;
};

/**
 * An actionable insight to follow up, as the Insights page of Agile
 * Analytics lists it.
 *
 * @public
 */
export type Insight = {
  id: number;
  /** The health area it is about, e.g. `delivery`. */
  area: string;
  priority: 'must' | 'could';
  status: 'new' | 'in_progress' | 'done' | 'dismissed';
  text?: { en?: string; nl?: string };
  /** ISO date of the last report that found it. */
  last_seen_at: string;
  in_latest_report?: boolean;
  team_hash?: string | null;
  jira_issue?: {
    key?: string | null;
    url?: string | null;
    status?: string | null;
    done?: boolean;
    summary?: string | null;
  } | null;
};
