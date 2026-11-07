// The client comes first and reads the made-up data defined below it; that
// is safe because its methods only run after the module has loaded.
/* eslint-disable @typescript-eslint/no-use-before-define */
import type {
  AiAdoption,
  AiCost,
  AiDelivery,
  AiMergeRequest,
  AiQuality,
  AiReturn,
  Collaboration,
  Deployment,
  DoraOverview,
  ErrorBudgetSeries,
  FailedDeployment,
  HealthMetric,
  HealthReport,
  HoursInvestment,
  KudosSummary,
  LeadTime,
  Organisation,
  Period,
  ReviewMetrics,
  ReviewSummary,
  Signal,
  SloReport,
  SprintReport,
  SprintResult,
  Team,
  TrendBucket,
  Trends,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import type { AgileAnalyticsReader } from './AgileAnalyticsClient';
import { weekBoundaries } from './period';

const DAY = 86_400;
const HOUR = 3_600;

/**
 * Made-up Agile Analytics data of Acme Robotics, served when
 * `agileAnalytics.demo` is true, to try the plugin without an Agile Analytics
 * account. The same question gets the same answer, so
 * screenshots can be retaken.
 */
export class DemoAgileAnalyticsClient implements AgileAnalyticsReader {
  async getOrganisation(): Promise<Organisation> {
    return {
      org_hash: 'ACME',
      org_name: 'Acme Robotics',
      subscription_level: 'enterprise',
    };
  }

  async getHealth(): Promise<HealthReport> {
    return { metrics: healthMetrics(0) };
  }

  async getTeamHealth(teamHash: string): Promise<HealthReport> {
    const index = TEAMS.findIndex(team => team.hash === teamHash);
    return { metrics: healthMetrics(index < 0 ? 0 : index + 1) };
  }

  async getTeams(): Promise<Team[]> {
    return TEAMS.map(team => ({ team_hash: team.hash, team_name: team.name }));
  }

  async getSignals(): Promise<Signal[]> {
    return [
      {
        kind: 'slo_over_budget',
        service: 'app-api',
        slo: 'Message delivery',
      },
      // before and after are DORA tiers, 4 being Elite
      {
        kind: 'tier_improved',
        area: 'delivery',
        metric: 'df',
        before: 3,
        after: 4,
      },
      {
        kind: 'slo_resolved',
        service: 'navigation-api',
        slo: 'Latency p95 < 250 ms',
      },
      { kind: 'recovered', area: 'ai', before: 74, after: 81 },
      {
        kind: 'bus_factor',
        repository: 'acme/apps/app-android',
      },
      {
        kind: 'orphaned',
        repository: 'acme/navigation/legacy-map-compat',
      },
      {
        kind: 'stale_work',
        key: 'ACME-1337',
        age_days: 41,
        summary: 'Shard the telemetry ledger before the fleet doubles',
      },
    ];
  }

  async getSloReport(): Promise<SloReport> {
    return {
      timestamp: new Date(today() * 1000).toISOString(),
      metrics: SLOS.map(slo => ({
        id: `${slo.service}-${slo.name}`,
        sloName: slo.name,
        service: slo.service,
        sloValue: slo.value,
        sloTarget: slo.target,
        errorBudget: slo.budget,
        team_hash: slo.team,
        team_name: teamName(slo.team),
      })),
    };
  }

  async getTrends(period: Period, node?: string): Promise<Trends> {
    const random = seeded(`trends:${period.start}:${node ?? ''}`);
    const end = Math.min(period.end, today() + DAY);
    const bucketDays = (period.end - period.start) / DAY > 62 ? 7 : 1;
    const repositories = TEAMS.flatMap(team => team.repos).filter(
      repo => !node || repo.startsWith(node),
    );
    const buckets: TrendBucket[] = [];
    for (let start = period.start; start < end; start += bucketDays * DAY) {
      const days = Math.min(bucketDays, (end - start) / DAY);
      // AI adoption grows over the period, deployments stay steady
      const progress = (start - period.start) / (period.end - period.start);
      const merged = Math.round(days * (5 + random() * 3));
      const unattributed = Math.round(merged * 0.1);
      const aiAssisted = Math.round(
        (merged - unattributed) * (0.45 + progress * 0.25),
      );
      const deployments = Math.round(days * (2 + random()));
      const failed = Math.round(deployments * (0.04 + random() * 0.06));
      buckets.push({
        start,
        days,
        partial: days < bucketDays,
        merged,
        ai_assisted: aiAssisted,
        not_ai_assisted: merged - unattributed - aiAssisted,
        unattributed,
        ai_share: aiAssisted / Math.max(1, merged - unattributed),
        deployments,
        failed_deployments: failed,
        deployment_frequency: (deployments - failed) / days,
        change_failure_rate: deployments ? failed / deployments : null,
        lead_time_for_changes: Math.round((8 + random() * 6) * HOUR),
        lead_time_for_changes_n: merged,
      });
    }
    return {
      node: node ?? null,
      repositories,
      single_repository: repositories.length === 1,
      bucket: bucketDays === 7 ? 'week' : 'day',
      buckets,
    };
  }

  async getSprintReport(): Promise<SprintReport> {
    const random = seeded('sprints');
    const now = today();
    const sprints: SprintResult[] = TEAMS.flatMap((team, board) =>
      [3, 2, 1].map(ago => {
        const committed = 20 + Math.floor(random() * 15);
        const completed = Math.round(committed * (0.7 + random() * 0.25));
        const added = Math.floor(random() * 6);
        return {
          board_id: board + 1,
          board: team.name,
          sprint_id: (board + 1) * 100 + ago,
          name: `${team.name} sprint ${40 - ago}`,
          start: new Date((now - ago * 14 * DAY) * 1000).toISOString(),
          end: new Date((now - (ago - 1) * 14 * DAY) * 1000).toISOString(),
          committed,
          completed,
          added,
          added_completed: Math.floor(added / 2),
          predictability: Math.round((completed / committed) * 100),
        };
      }),
    );
    const item = (team: (typeof TEAMS)[number], i: number, age: number) => ({
      key: `ACME-${1200 + i}`,
      summary: team.titles[i % team.titles.length],
      status: 'In Progress',
      type: 'Story',
      project: 'PIPE',
      age_days: age,
    });
    const score =
      sprints.reduce((sum, sprint) => sum + (sprint.predictability ?? 0), 0) /
      sprints.length;
    return {
      timestamp: new Date(now * 1000).toISOString(),
      flow: {
        items: 46,
        young_days: 5,
        young_share: 61,
        oldest_days: 38,
        median_days: 4,
        buckets: [
          { id: '0-2', count: 18 },
          { id: '3-5', count: 10 },
          { id: '6-10', count: 9 },
          { id: '11-20', count: 6 },
          { id: '21+', count: 3 },
        ],
        oldest: TEAMS.slice(0, 3).map((team, i) => item(team, i, 38 - i * 7)),
        stale_days: 14,
        stale: TEAMS.slice(1, 3).map((team, i) => item(team, i + 3, 17 - i)),
        abandoned_days: 30,
        abandoned: 2,
      },
      predictability: {
        score: Math.round(score),
        lookback_days: 42,
        sprints_per_board: 3,
        min_sprints: 2,
        sprints,
      },
      teams: Object.fromEntries(
        TEAMS.map((team, i) => [
          team.hash,
          {
            items: 8 + i * 2,
            young_days: 5,
            young_share: 70 - i * 5,
            oldest_days: 12 + i * 6,
            abandoned: i % 2,
          },
        ]),
      ),
    };
  }

  async getHoursInvestment(): Promise<HoursInvestment> {
    const random = seeded('hours');
    const hours = TEAMS.map(team => ({
      project: team.name,
      hours: Math.round(120 + random() * 200),
    }));
    const total = hours.reduce((sum, h) => sum + h.hours, 0);
    return {
      timestamp: new Date(today() * 1000).toISOString(),
      metrics: hours.map((h, i) => ({
        id: i + 1,
        project: h.project,
        hours: h.hours,
        percentage: Math.round((h.hours / total) * 1000) / 10,
        trend: Math.round((random() - 0.5) * 40),
      })),
    };
  }

  async getKudos(period: Period, teamHash?: string): Promise<KudosSummary> {
    const random = seeded(`kudos:${period.start}:${teamHash ?? ''}`);
    const people = teamHash ? 6 : 34;
    const distribution = Array.from(
      { length: Math.round(people * 0.7) },
      () => 1 + Math.floor(random() ** 2 * 9),
    ).sort((a, b) => b - a);
    return {
      total: distribution.reduce((sum, count) => sum + count, 0),
      givers: Math.round(people * 0.6),
      receivers: distribution.length,
      people,
      distribution,
    };
  }

  async getDoraOverview(): Promise<DoraOverview> {
    return {
      timestamp: new Date(today() * 1000).toISOString(),
      metrics: [
        { id: 'df', value: 2.4, trend: 1, change: 0.6 },
        { id: 'lt', value: 9.5 * HOUR, trend: 1, change: -3.1 * HOUR },
        { id: 'mttr', value: 1.8, trend: 1, change: -0.7 },
        { id: 'cfr', value: 8.3, trend: -1, change: 1.2 },
      ],
    };
  }

  async getDeployments(
    period: Period,
    teamHash?: string,
  ): Promise<Deployment[]> {
    const random = seeded(`deployments:${period.start}`);
    const deployments: Deployment[] = [];
    for (let day = period.start; day < period.end; day += DAY) {
      if (day > today()) break;
      const weekend = isWeekend(day);
      for (const team of TEAMS) {
        const perDay = weekend ? 0.3 : team.deploysPerDay;
        const count = Math.floor(perDay + random());
        for (let i = 0; i < count; i++) {
          const repository = pick(random, team.repos);
          const failed = random() < 0.06;
          if (teamHash && team.hash !== teamHash) continue;
          deployments.push({
            repository: gitUrl(repository),
            environment: 'production',
            status: failed ? 'failed' : 'success',
            timestamp: day + Math.floor((9 + random() * 9) * HOUR),
            production: !failed,
            production_attempt: true,
          });
        }
      }
    }
    return deployments.sort((a, b) => a.timestamp - b.timestamp);
  }

  async getLeadTimes(period: Period): Promise<LeadTime[]> {
    const random = seeded(`leadtimes:${period.start}`);
    const days = (Math.min(period.end, today() + DAY) - period.start) / DAY;
    return Array.from({ length: Math.round(days * 6) }, () => {
      const team = pick(random, TEAMS);
      const forChanges = Math.floor((0.5 + random() ** 2 * 30) * HOUR);
      const cycle = forChanges + Math.floor((4 + random() * 60) * HOUR);
      return {
        repository: pick(random, team.repos),
        lead_time: cycle + Math.floor(random() * 5 * DAY),
        cycle_time: cycle,
        lead_time_for_changes: forChanges,
        timestamp: period.start + Math.floor(random() * days * DAY),
        key: `ACME-${1000 + Math.floor(random() * 900)}`,
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }

  async getFailedDeployments(period: Period): Promise<FailedDeployment[]> {
    const random = seeded(`failures:${period.start}`);
    const days = (Math.min(period.end, today()) - period.start) / DAY;
    const count = Math.max(1, Math.round(days / 4));
    return Array.from({ length: count }, (_, i) => {
      const incident = INCIDENTS[i % INCIDENTS.length];
      const timestamp =
        period.start + Math.floor(((i + random()) / count) * days * DAY);
      const restore =
        i === count - 1 && days > 7
          ? null
          : Math.floor((0.3 + random() * 3) * HOUR);
      return {
        repository: gitUrl(incident.repository),
        environment: 'production',
        timestamp,
        restored_at: restore ? timestamp + restore : null,
        time_to_restore: restore,
        remediations: restore
          ? [
              {
                source_branch: incident.branch,
                title: incident.title,
                merged_date: timestamp + restore / 2,
                deployment_date: timestamp + restore,
              },
            ]
          : [],
        slo_alerts: incident.slo
          ? [
              {
                service: incident.slo.service,
                slo_name: incident.slo.name,
                started: timestamp + 300,
                ended: restore ? timestamp + restore : null,
              },
            ]
          : [],
      };
    });
  }

  async getAiAdoption(period: Period): Promise<AiAdoption> {
    const mergeRequests = this.mergeRequests(period);
    const attributed = mergeRequests.filter(mr => mr.ai_assisted !== null);
    const ai = attributed.filter(mr => mr.ai_assisted).length;
    const commits = mergeRequests.length * 7;
    const aiCommits = Math.round(commits * 0.64);
    return {
      total: mergeRequests.length,
      attributed: attributed.length,
      ai_assisted: ai,
      not_ai_assisted: attributed.length - ai,
      unattributed: mergeRequests.length - attributed.length,
      coverage: attributed.length / mergeRequests.length,
      adoption_rate: ai / attributed.length,
      merge_requests: mergeRequests,
      commits: {
        total: commits,
        ai_assisted: aiCommits,
        adoption_rate: aiCommits / commits,
        tools: {
          'Claude Code': Math.round(aiCommits * 0.68),
          Copilot: Math.round(aiCommits * 0.21),
          Cursor: Math.round(aiCommits * 0.11),
        },
      },
    };
  }

  async getAiDelivery(period: Period): Promise<AiDelivery> {
    const scale = periodScale(period);
    const verdict = (ai: number, other: number, reliable = true) => ({
      repositories: 19,
      ai_count: Math.round(46 * scale),
      other_count: Math.round(27 * scale),
      ai_typical: ai,
      other_typical: other,
      difference: ai - other,
      interval: reliable
        ? ([ai - other - 0.4 * HOUR, ai - other + 0.3 * HOUR] as [
            number,
            number,
          ])
        : null,
      reliable,
    });
    return {
      metrics: {
        time_to_first_approval: verdict(1.4 * HOUR, 2.9 * HOUR),
        time_to_merge: verdict(7.2 * HOUR, 12.8 * HOUR),
        time_to_deploy: verdict(19 * HOUR, 22 * HOUR, scale >= 1),
      },
      unattributed: Math.round(6 * scale),
      min_cohort_size: 5,
    };
  }

  async getAiQuality(period: Period): Promise<AiQuality> {
    const scale = periodScale(period);
    const cohort = (repositories: number, deployments: number, cfr: number) => {
      const total = Math.round(deployments * scale);
      const failed = Math.round(total * cfr);
      return {
        repositories,
        deployments: total,
        failed_deployments: failed,
        change_failure_rate: total ? failed / total : null,
      };
    };
    const rework = (merged: number, rate: number) => {
      const total = Math.round(merged * scale);
      const reworked = Math.round(total * rate);
      return {
        merged: total,
        enough: total >= 5,
        reworked,
        rework_rate: total ? reworked / total : null,
      };
    };
    return {
      cohorts: { high_ai: cohort(12, 52, 0.077), low_ai: cohort(7, 21, 0.143) },
      threshold: 0.5,
      rework: {
        window_days: 14,
        cohorts: { ai: rework(46, 0.065), other: rework(27, 0.074) },
      },
    };
  }

  async getAiCost(period: Period): Promise<AiCost> {
    const scale = periodScale(period);
    const tools = [
      { tool: 'Claude Code', seats: 18, monthly: 2160, share: 0.68 },
      { tool: 'GitHub Copilot', seats: 22, monthly: 418, share: 0.21 },
      { tool: 'Cursor', seats: 6, monthly: 240, share: 0.11 },
    ];
    const aiMergeRequests = Math.round(46 * scale);
    const toolCosts = tools.map(tool => {
      const authors = Math.round(tool.seats * (0.7 + tool.share * 0.4));
      return {
        tool: tool.tool,
        configured: true,
        seats: tool.seats,
        spend: Math.round(tool.monthly * scale * 0.5),
        ai_merge_requests: Math.round(aiMergeRequests * tool.share),
        active_authors: authors,
        seat_use: authors / tool.seats,
      };
    });
    const spend = toolCosts.reduce((sum, tool) => sum + (tool.spend ?? 0), 0);
    return {
      currency: 'USD',
      configured: true,
      spend,
      ai_merge_requests: aiMergeRequests,
      cost_per_ai_merge_request: spend / aiMergeRequests,
      tools: toolCosts,
    };
  }

  async getAiReturn(period: Period): Promise<AiReturn> {
    const cost = await this.getAiCost(period);
    const hoursSaved = Math.round(cost.ai_merge_requests * 2.6);
    const value = hoursSaved * 120;
    return {
      currency: 'USD',
      hourly_rate: 120,
      ai_merge_requests: cost.ai_merge_requests,
      hours_saved: hoursSaved,
      value,
      spend: cost.spend,
      net: value - (cost.spend ?? 0),
      return_ratio: value / (cost.spend ?? 1),
      measurement: { people_compared: 17, reliable: true },
    };
  }

  async getCollaboration(windowDays: number): Promise<Collaboration> {
    const asOf = today();
    const date = (daysAgo: number) =>
      new Date((asOf - daysAgo * DAY) * 1000).toISOString().slice(0, 10);
    const id = (name: string) => PEOPLE.findIndex(p => p.name === name) + 1;
    return {
      as_of: date(0),
      window_start: date(windowDays),
      inactive_days: 90,
      people: PEOPLE.map((person, i) => ({
        id: i + 1,
        name: person.name,
        active: person.active,
        last_active: date(person.active ? i % 4 : 140 + i * 3),
        teams: person.teams.map(teamName),
      })),
      repositories: REPOSITORIES.map(repository => ({
        repository: repository.repository,
        status: repository.status,
        activity: repository.activity,
        last_activity: date(repository.lastActivity),
        bus_factor: repository.owners.filter(
          ([name]) => PEOPLE[id(name) - 1]?.active,
        ).length,
        teams: repository.team ? [teamName(repository.team)] : [],
        owners: repository.owners.map(([name, share]) => ({
          person_id: id(name),
          name,
          share,
          active: PEOPLE[id(name) - 1]?.active ?? false,
        })),
      })),
      teams: TEAMS.map(team => ({
        hash: team.hash,
        name: team.name,
        members: PEOPLE.flatMap((person, i) =>
          person.teams.includes(team.hash) ? [i + 1] : [],
        ),
        repositories: REPOSITORIES.filter(r => r.team === team.hash).map(
          r => r.repository,
        ),
        coverage: team.coverage,
        focus: team.focus,
      })),
      repositories_without_team: REPOSITORIES.filter(r => !r.team).map(
        r => r.repository,
      ),
      people_without_team: PEOPLE.flatMap((person, i) =>
        person.teams.length ? [] : [i + 1],
      ),
    };
  }

  async getReviewSummary(
    period: Period,
    teamHash?: string,
  ): Promise<ReviewSummary> {
    const random = seeded(`reviews:${period.start}:${teamHash ?? ''}`);
    const scale = periodScale(period);
    const repositories = TEAMS.filter(
      team => !teamHash || team.hash === teamHash,
    ).flatMap(team =>
      team.repos.map(repository => ({
        repository,
        ...reviewMetrics(
          Math.max(1, Math.round((3 + random() * 9) * scale)),
          random,
        ),
      })),
    );
    const merged = repositories.reduce((sum, r) => sum + r.merged, 0);
    const without = repositories.reduce(
      (sum, r) => sum + r.without_approval,
      0,
    );
    return {
      merged,
      approved: merged - without,
      without_approval: without,
      unknown: 0,
      without_approval_share: merged ? without / merged : null,
      wait_to_first_approval_hours: { p50: 1.9, p75: 6.4, n: merged - without },
      created_to_merged_hours: { p50: 9.6, p75: 27, n: merged },
      period: { date_start: period.start, date_end: period.end },
      team: teamHash ?? null,
      repositories,
    };
  }

  async getErrorBudgets(
    period: Period,
    now = Date.now(),
  ): Promise<ErrorBudgetSeries[]> {
    const random = seeded(`budgets:${period.start}`);
    const weeks = weekBoundaries(now);
    const end = Math.min(period.end, today() + DAY);
    const days = Math.round((end - period.start) / DAY);
    return SLOS.map(slo => {
      // From a fuller budget at the start of the period to today's value
      const from = Math.min(100, slo.budget + 15 + random() * 25);
      const at = (fraction: number) => from + (slo.budget - from) * fraction;
      return {
        service: slo.service,
        slo_name: slo.name,
        slo_description: slo.description,
        slo_target: slo.target,
        data: Array.from({ length: days }, (_, i) => {
          const fraction = days > 1 ? i / (days - 1) : 1;
          const good = Math.round(slo.eventsPerDay * (0.9 + random() * 0.2));
          const bad = Math.round(good * (1 - slo.target) * (0.4 + random()));
          return [
            period.start + i * DAY,
            Math.min(
              100,
              round(at(fraction) + (i === days - 1 ? 0 : (random() - 0.5) * 4)),
            ),
            { good_events: good, bad_events: bad },
          ];
        }),
        history: weeks.slice(0, -1).map((start, i) => ({
          start,
          end: weeks[i + 1],
          remaining: Math.min(100, round(at(i / 3) + (random() - 0.5) * 6)),
          reports: i === 3 ? (today() - start) / DAY + 1 : 7,
        })),
      };
    });
  }

  private mergeRequests(period: Period): AiMergeRequest[] {
    const random = seeded(`mrs:${period.start}`);
    const days = (Math.min(period.end, today() + DAY) - period.start) / DAY;
    return Array.from(
      { length: Math.round(days * 5.5) },
      (_, i): AiMergeRequest => {
        const team = pick(random, TEAMS);
        const people = PEOPLE.filter(
          person => person.active && person.teams.includes(team.hash),
        );
        const author = pick(random, people.length ? people : PEOPLE).name;
        const r = random();
        const aiAssisted = r < 0.08 ? null : r < 0.66;
        const tool = random();
        return {
          repository: pick(random, team.repos),
          iid: 200 + i * 3 + Math.floor(random() * 3),
          title: pick(random, team.titles),
          author,
          merged_date: period.start + Math.floor(random() * days * DAY),
          ai_assisted: aiAssisted,
          ai_signal: aiAssisted === null ? null : aiSignal(random()),
          ai_tool: aiAssisted ? aiTool(tool) : null,
          lines_added: Math.floor(10 + random() ** 2 * 600),
          lines_removed: Math.floor(random() ** 2 * 250),
        };
      },
    ).sort((a, b) => (b.merged_date ?? 0) - (a.merged_date ?? 0));
  }
}

const TEAMS = [
  {
    hash: 'navigation',
    name: 'Navigation',
    deploysPerDay: 0.9,
    coverage: 1,
    focus: 0.84,
    repos: [
      'acme/navigation/path-planner-core',
      'acme/navigation/navigation-api',
      'acme/navigation/planner-bench',
      'acme/navigation/map-tile-worker',
    ],
    titles: [
      'SIMD path for the route cost function',
      'Stream chunks larger than 4 GB',
      'Path cost regression check in CI',
      'Faster map warm-up at boot',
      'Drop the legacy map compatibility shim',
    ],
  },
  {
    hash: 'fleet',
    name: 'Fleet',
    deploysPerDay: 0.7,
    coverage: 0.75,
    focus: 0.71,
    repos: [
      'acme/fleet/fleet-agent',
      'acme/fleet/fleet-gateway',
      'acme/fleet/telemetry-ledger',
      'acme/fleet/robot-firmware',
    ],
    titles: [
      'Peer scoring for flaky robots',
      'Gossip fewer shard maps',
      'Gateway: cache content addresses',
      'Telemetry: batch ledger writes',
      'Robot firmware: OTA rollback',
    ],
  },
  {
    hash: 'apps',
    name: 'Apps',
    deploysPerDay: 1.1,
    coverage: 0.9,
    focus: 0.78,
    repos: [
      'acme/apps/app-api',
      'acme/apps/app-web',
      'acme/apps/app-ios',
      'acme/apps/app-android',
    ],
    titles: [
      'Live delivery tracking',
      'Read receipts in group chats',
      'Push notifications through the platform',
      'Dark mode for the web app',
      'Retry sends on flaky networks',
    ],
  },
  {
    hash: 'platform',
    name: 'Platform',
    deploysPerDay: 0.8,
    coverage: 1,
    focus: 0.88,
    repos: [
      'acme/platform/auth-service',
      'acme/platform/api-gateway',
      'acme/platform/billing-service',
      'acme/platform/infrastructure',
    ],
    titles: [
      'Rotate signing keys without downtime',
      'Rate limits per API key',
      'Usage-based billing for the navigation API',
      'Terraform: Cloud Run min instances per service',
      'Passkeys for acme.example accounts',
    ],
  },
  {
    hash: 'growth',
    name: 'Growth',
    deploysPerDay: 0.6,
    coverage: 0.67,
    focus: 0.62,
    repos: [
      'acme/growth/acme-website',
      'acme/growth/docs-site',
      'acme/growth/signup-funnel',
    ],
    titles: [
      'New pricing page',
      'Docs: quick start for the navigation API',
      'Shorter sign-up form',
      'Faster LCP on the home page',
    ],
  },
  {
    hash: 'data',
    name: 'Data',
    deploysPerDay: 0.4,
    coverage: 0.5,
    focus: 0.69,
    repos: ['acme/data/event-ingestor', 'acme/data/delivery-leaderboard'],
    titles: [
      'Ingest robot events in batches',
      'Daily delivery leaderboard',
      'Partition events by day',
    ],
  },
];

const PEOPLE: { name: string; active: boolean; teams: string[] }[] = [
  { name: 'Alex Morgan', active: true, teams: ['navigation'] },
  { name: 'Jordan Blake', active: true, teams: ['platform', 'fleet'] },
  { name: 'Ravi Kapoor', active: true, teams: ['apps', 'fleet'] },
  { name: 'Sofia Marquez', active: true, teams: ['growth'] },
  { name: 'Daniel Price', active: true, teams: [] },
  { name: 'Carla Walton', active: true, teams: ['navigation'] },
  { name: 'Chris Novak', active: false, teams: ['growth'] },
  { name: 'Oliver Grant', active: false, teams: [] },
  { name: 'Priya Natarajan', active: true, teams: ['navigation'] },
  { name: 'Sam Okafor', active: true, teams: ['fleet'] },
  { name: 'Lena Fischer', active: true, teams: ['fleet'] },
  { name: 'Tomás Rivera', active: true, teams: ['apps'] },
  { name: 'Mei Lin', active: true, teams: ['apps'] },
  { name: 'Kenji Sato', active: true, teams: ['apps'] },
  { name: 'Hannah Vos', active: true, teams: ['platform'] },
  { name: 'Yusuf Demir', active: true, teams: ['platform'] },
  { name: 'Ashley Kim', active: true, teams: ['growth'] },
  { name: 'Noah Becker', active: true, teams: ['data'] },
  { name: 'Grace Mensah', active: true, teams: ['data'] },
];

const REPOSITORIES: {
  repository: string;
  team?: string;
  status: 'healthy' | 'at_risk' | 'dormant' | 'orphaned';
  activity: number;
  lastActivity: number;
  owners: [string, number][];
}[] = [
  {
    repository: 'acme/navigation/path-planner-core',
    team: 'navigation',
    status: 'healthy',
    activity: 182,
    lastActivity: 0,
    owners: [
      ['Alex Morgan', 0.46],
      ['Carla Walton', 0.27],
      ['Priya Natarajan', 0.19],
    ],
  },
  {
    repository: 'acme/navigation/navigation-api',
    team: 'navigation',
    status: 'healthy',
    activity: 96,
    lastActivity: 1,
    owners: [
      ['Carla Walton', 0.41],
      ['Priya Natarajan', 0.33],
      ['Alex Morgan', 0.2],
    ],
  },
  {
    repository: 'acme/navigation/planner-bench',
    team: 'navigation',
    status: 'at_risk',
    activity: 23,
    lastActivity: 6,
    owners: [['Alex Morgan', 0.88]],
  },
  {
    repository: 'acme/navigation/legacy-map-compat',
    status: 'orphaned',
    activity: 4,
    lastActivity: 210,
    owners: [
      ['Chris Novak', 0.7],
      ['Oliver Grant', 0.3],
    ],
  },
  {
    repository: 'acme/navigation/map-tile-worker',
    team: 'navigation',
    status: 'healthy',
    activity: 51,
    lastActivity: 3,
    owners: [
      ['Priya Natarajan', 0.52],
      ['Carla Walton', 0.3],
    ],
  },
  {
    repository: 'acme/fleet/fleet-agent',
    team: 'fleet',
    status: 'healthy',
    activity: 141,
    lastActivity: 0,
    owners: [
      ['Jordan Blake', 0.38],
      ['Sam Okafor', 0.31],
      ['Lena Fischer', 0.22],
    ],
  },
  {
    repository: 'acme/fleet/fleet-gateway',
    team: 'fleet',
    status: 'healthy',
    activity: 77,
    lastActivity: 1,
    owners: [
      ['Lena Fischer', 0.49],
      ['Sam Okafor', 0.34],
    ],
  },
  {
    repository: 'acme/fleet/telemetry-ledger',
    team: 'fleet',
    status: 'at_risk',
    activity: 38,
    lastActivity: 2,
    owners: [
      ['Ravi Kapoor', 0.81],
      ['Sam Okafor', 0.12],
    ],
  },
  {
    repository: 'acme/fleet/robot-firmware',
    team: 'fleet',
    status: 'dormant',
    activity: 6,
    lastActivity: 64,
    owners: [
      ['Jordan Blake', 0.72],
      ['Lena Fischer', 0.2],
    ],
  },
  {
    repository: 'acme/apps/app-api',
    team: 'apps',
    status: 'healthy',
    activity: 124,
    lastActivity: 0,
    owners: [
      ['Ravi Kapoor', 0.35],
      ['Tomás Rivera', 0.3],
      ['Mei Lin', 0.21],
    ],
  },
  {
    repository: 'acme/apps/app-web',
    team: 'apps',
    status: 'healthy',
    activity: 88,
    lastActivity: 0,
    owners: [
      ['Mei Lin', 0.44],
      ['Tomás Rivera', 0.28],
    ],
  },
  {
    repository: 'acme/apps/app-ios',
    team: 'apps',
    status: 'healthy',
    activity: 59,
    lastActivity: 2,
    owners: [
      ['Kenji Sato', 0.62],
      ['Mei Lin', 0.24],
    ],
  },
  {
    repository: 'acme/apps/app-android',
    team: 'apps',
    status: 'at_risk',
    activity: 41,
    lastActivity: 4,
    owners: [['Tomás Rivera', 0.86]],
  },
  {
    repository: 'acme/platform/auth-service',
    team: 'platform',
    status: 'healthy',
    activity: 67,
    lastActivity: 1,
    owners: [
      ['Hannah Vos', 0.45],
      ['Jordan Blake', 0.3],
      ['Yusuf Demir', 0.2],
    ],
  },
  {
    repository: 'acme/platform/api-gateway',
    team: 'platform',
    status: 'healthy',
    activity: 54,
    lastActivity: 2,
    owners: [
      ['Yusuf Demir', 0.5],
      ['Hannah Vos', 0.32],
    ],
  },
  {
    repository: 'acme/platform/billing-service',
    team: 'platform',
    status: 'healthy',
    activity: 46,
    lastActivity: 3,
    owners: [
      ['Hannah Vos', 0.4],
      ['Yusuf Demir', 0.38],
    ],
  },
  {
    repository: 'acme/platform/infrastructure',
    team: 'platform',
    status: 'healthy',
    activity: 102,
    lastActivity: 0,
    owners: [
      ['Jordan Blake', 0.58],
      ['Yusuf Demir', 0.24],
      ['Hannah Vos', 0.12],
    ],
  },
  {
    repository: 'acme/growth/acme-website',
    team: 'growth',
    status: 'healthy',
    activity: 63,
    lastActivity: 1,
    owners: [
      ['Ashley Kim', 0.55],
      ['Sofia Marquez', 0.2],
    ],
  },
  {
    repository: 'acme/growth/docs-site',
    team: 'growth',
    status: 'healthy',
    activity: 39,
    lastActivity: 2,
    owners: [
      ['Ashley Kim', 0.4],
      ['Carla Walton', 0.22],
      ['Priya Natarajan', 0.15],
    ],
  },
  {
    repository: 'acme/growth/signup-funnel',
    team: 'growth',
    status: 'at_risk',
    activity: 17,
    lastActivity: 9,
    owners: [
      ['Ashley Kim', 0.71],
      ['Chris Novak', 0.25],
    ],
  },
  {
    repository: 'acme/data/event-ingestor',
    team: 'data',
    status: 'healthy',
    activity: 44,
    lastActivity: 1,
    owners: [
      ['Noah Becker', 0.52],
      ['Grace Mensah', 0.38],
    ],
  },
  {
    repository: 'acme/data/delivery-leaderboard',
    team: 'data',
    status: 'healthy',
    activity: 21,
    lastActivity: 5,
    owners: [
      ['Grace Mensah', 0.6],
      ['Noah Becker', 0.3],
    ],
  },
  {
    repository: 'acme/growth/old-campaign-site',
    status: 'dormant',
    activity: 2,
    lastActivity: 120,
    owners: [['Daniel Price', 1]],
  },
];

const SLOS = [
  {
    service: 'navigation-api',
    name: 'Availability',
    description: 'Navigation requests answered without a 5xx',
    target: 0.999,
    value: 99.96,
    budget: 61.4,
    team: 'navigation',
    eventsPerDay: 4_200_000,
  },
  {
    service: 'navigation-api',
    name: 'Latency p95 < 250 ms',
    description: 'Navigation of files up to 10 MB',
    target: 0.99,
    value: 99.31,
    budget: 31.2,
    team: 'navigation',
    eventsPerDay: 4_200_000,
  },
  {
    service: 'fleet-gateway',
    name: 'Availability',
    description: 'Content fetched through the HTTP gateway',
    target: 0.995,
    value: 99.82,
    budget: 64.1,
    team: 'fleet',
    eventsPerDay: 1_800_000,
  },
  {
    service: 'app-api',
    name: 'Availability',
    target: 0.999,
    description: 'App API requests without a 5xx',
    value: 99.93,
    budget: 28.7,
    team: 'apps',
    eventsPerDay: 9_600_000,
  },
  {
    service: 'app-api',
    name: 'Message delivery',
    description: 'Messages delivered to every device within 2 seconds',
    target: 0.995,
    value: 99.41,
    budget: -18.2,
    team: 'apps',
    eventsPerDay: 22_000_000,
  },
  {
    service: 'auth-service',
    name: 'Availability',
    description: 'Sign-ins and token refreshes',
    target: 0.999,
    value: 99.99,
    budget: 82.5,
    team: 'platform',
    eventsPerDay: 3_100_000,
  },
  {
    service: 'billing-service',
    name: 'Invoices on time',
    description: 'Invoices sent within an hour of the billing run',
    target: 0.99,
    value: 99.7,
    budget: 70,
    team: 'platform',
    eventsPerDay: 12_000,
  },
  {
    service: 'acme-website',
    name: 'Availability',
    description: 'acme.example pages served',
    target: 0.995,
    value: 99.98,
    budget: 95.2,
    team: 'growth',
    eventsPerDay: 640_000,
  },
];

const INCIDENTS = [
  {
    repository: 'acme/apps/app-api',
    branch: 'hotfix/fanout-backpressure',
    title: 'Back-pressure on group message fan-out',
    slo: { service: 'app-api', name: 'Message delivery' },
  },
  {
    repository: 'acme/navigation/navigation-api',
    branch: 'revert-simd-kernel',
    title: 'Revert "SIMD path for the route cost function"',
    slo: { service: 'navigation-api', name: 'Latency p95 < 250 ms' },
  },
  {
    repository: 'acme/platform/api-gateway',
    branch: 'hotfix/rate-limit-header',
    title: 'Send Retry-After with 429 responses',
  },
  {
    repository: 'acme/fleet/fleet-gateway',
    branch: 'hotfix/shard-map-null',
    title: 'Fix empty shard map after node restart',
    slo: { service: 'fleet-gateway', name: 'Availability' },
  },
  {
    repository: 'acme/growth/signup-funnel',
    branch: 'revert-new-signup-form',
    title: 'Revert "Shorter sign-up form"',
  },
];

/** The health report of the organisation (0) or a team (1 and up) */
function healthMetrics(variant: number): HealthMetric[] {
  const shift = [0, 6, -4, -9, 3, 8, -12][variant] ?? 0;
  const score = (base: number) => Math.max(5, Math.min(98, base + shift));
  const status = (value: number) => {
    if (value >= 75) return 1;
    return value >= 55 ? 0 : -1;
  };
  const area = (
    id: string,
    base: number,
    trend: number,
    extra: Partial<HealthMetric> = {},
  ): HealthMetric => {
    const value = score(base);
    return { id, score: value, status: status(value), trend, ...extra };
  };
  return [
    area('ai', 81, 6, {
      // Percentages, as the Agile Analytics health report gives them
      adoption: 64.4,
      target: 50,
      targets: [{ metric: 'adoption', met: true }],
    }),
    area('collaboration', 72, 2),
    area('kudos', 86, 4, { workers: 19 }),
    area('pulse', 69, -3, {
      respondents: 15,
      round_started_on: new Date((today() - 9 * DAY) * 1000)
        .toISOString()
        .slice(0, 10),
    }),
    area('delivery', 84, 5, {
      targets: [
        { metric: 'df', met: true },
        { metric: 'lt', met: true },
        { metric: 'cfr', met: false },
      ],
    }),
    area('reliability', 64, -6, { slos: SLOS.length, within_budget: 7 }),
    // Flow is a number of days, lower is better
    {
      id: 'flow',
      score: Math.max(2, 4.5 - shift / 5),
      status: 1,
      trend: -0.8,
      sprints: 6,
      min_sprints: 3,
      oldest_days: 41,
    },
    area('execution', 77, 3, { abandoned: 2 }),
    area('investment', 59, -2),
  ];
}

function reviewMetrics(merged: number, random: () => number): ReviewMetrics {
  const without = random() < 0.25 ? Math.ceil(merged * 0.15) : 0;
  return {
    merged,
    approved: merged - without,
    without_approval: without,
    unknown: 0,
    without_approval_share: without / merged,
    wait_to_first_approval_hours: {
      p50: round(0.6 + random() * 4),
      p75: round(3 + random() * 10),
      n: merged - without,
    },
    created_to_merged_hours: {
      p50: round(4 + random() * 16),
      p75: round(18 + random() * 40),
      n: merged,
    },
  };
}

function teamName(hash: string) {
  return TEAMS.find(team => team.hash === hash)?.name ?? ' - ';
}

function gitUrl(repository: string) {
  return `git@github.com:${repository}.git`;
}

function today() {
  return Math.floor(Date.now() / 1000 / DAY) * DAY;
}

function isWeekend(day: number) {
  // 1 January 1970 was a Thursday
  const weekday = (Math.floor(day / DAY) + 4) % 7;
  return weekday === 0 || weekday === 6;
}

/** How many two-week periods the period is, as counts above are per 14 days */
function periodScale(period: Period) {
  return (period.end - period.start) / (14 * DAY);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length)];
}

/** A random number generator that gives the same numbers for the same key */
function seeded(key: string): () => number {
  let seed = 2166136261;
  for (let i = 0; i < key.length; i++) {
    seed = Math.imul(seed ^ key.charCodeAt(i), 16777619) >>> 0;
  }
  seed = seed % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function aiSignal(draw: number) {
  return draw < 0.8 ? 'commit_trailer' : 'pr_label';
}

function aiTool(draw: number) {
  if (draw < 0.68) return 'Claude Code';
  return draw < 0.89 ? 'Copilot' : 'Cursor';
}
