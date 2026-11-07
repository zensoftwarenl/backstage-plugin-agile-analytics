import type { DoraData } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { doraBand, summariseDora } from './dora';

const DAY = 86_400;
const START = 1_800_000_000 - (1_800_000_000 % DAY);

function data(overrides: Partial<DoraData> = {}): DoraData {
  return {
    period: { start: START, end: START + 4 * DAY },
    team: null,
    deployments: [
      {
        repository: 'git@gitlab.com:acme/api.git',
        timestamp: START + 10,
        production: true,
      },
      { repository: 'acme/api', timestamp: START + DAY + 10, production: true },
      { repository: 'acme/web', timestamp: START + DAY + 20, production: true },
      // A failed production job is not a deployment
      { repository: 'acme/web', timestamp: START + 2 * DAY, production: false },
      // Outside the period
      { repository: 'acme/web', timestamp: START - 10, production: true },
    ],
    leadTimes: [
      {
        repository: 'acme/api',
        lead_time: 10,
        cycle_time: 5,
        lead_time_for_changes: 3600,
        timestamp: START + 10,
      },
      {
        repository: 'acme/web',
        lead_time: 10,
        cycle_time: 5,
        lead_time_for_changes: 7200,
        timestamp: START + DAY + 20,
      },
    ],
    failures: [
      {
        repository: 'acme/api',
        timestamp: START + DAY + 10,
        restored_at: START + DAY + 7210,
        time_to_restore: 7200,
      },
    ],
    ...overrides,
  };
}

describe('summariseDora', () => {
  it('derives the four metrics like the Agile Analytics web app', () => {
    const summary = summariseDora(data());

    expect(summary.productionDeployments).toBe(3);
    expect(summary.deploymentFrequency).toBe(0.75);
    expect(summary.leadTime).toBe(5400);
    expect(summary.timeToRestore).toBe(2);
    expect(summary.changeFailureRate).toBeCloseTo(33.33, 1);
    expect(summary.days.map(d => [d.deployments, d.failed])).toEqual([
      [1, 0],
      [2, 1],
      [0, 0],
      [0, 0],
    ]);
  });

  it('groups repositories however their path is written', () => {
    const { repositories } = summariseDora(data());

    expect(repositories).toEqual([
      {
        repository: 'acme/api',
        deployments: 2,
        failed: 1,
        changeFailureRate: 50,
        leadTime: 3600,
      },
      {
        repository: 'acme/web',
        deployments: 1,
        failed: 0,
        changeFailureRate: 0,
        leadTime: 7200,
      },
    ]);
  });

  it("narrows a team's lead times and failures to its repositories", () => {
    const summary = summariseDora(
      data({
        team: 't1',
        deployments: [
          { repository: 'acme/web', timestamp: START + 10, production: true },
        ],
      }),
    );

    expect(summary.leadTime).toBe(7200);
    expect(summary.failedDeployments).toEqual([]);
    expect(summary.changeFailureRate).toBe(0);
  });

  it('has no failure rate without deployments', () => {
    expect(
      summariseDora(data({ deployments: [], failures: [] })).changeFailureRate,
    ).toBeNull();
  });
});

describe('doraBand', () => {
  it('uses the DORA benchmarks of the web app', () => {
    expect(doraBand('df', 1)?.key).toBe('elite');
    expect(doraBand('df', 0.2)?.key).toBe('high');
    expect(doraBand('df', 0.01)?.key).toBe('low');
    expect(doraBand('lt', DAY)?.key).toBe('elite');
    expect(doraBand('lt', 3 * DAY)?.key).toBe('high');
    expect(doraBand('mttr', 30)?.key).toBe('medium');
    expect(doraBand('cfr', 50)?.key).toBe('low');
    expect(doraBand('cfr', null)).toBeUndefined();
  });
});
