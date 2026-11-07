import { HealthMetric } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import {
  areaBasis,
  areasNeedingAttention,
  describeSignal,
  groupByPillar,
  scoreTone,
  totalScore,
} from './health';

const metrics: HealthMetric[] = [
  { id: 'delivery', score: 80, status: 1 },
  { id: 'reliability', score: 60, status: 0 },
  { id: 'ai', score: 40, status: -1, adoption: 22.46, target: 50 },
  { id: 'kudos', score: 90, status: 1 },
  // Not set up, so it does not count towards DevEx
  { id: 'collaboration', score: 0, available: false },
  // Measured in days, so it does not count towards AgileEx
  { id: 'flow', score: 12, oldest_days: 12 },
  { id: 'execution', score: 70, status: 1, available: true },
];

describe('health', () => {
  it('averages each pillar over its available areas', () => {
    const pillars = groupByPillar(metrics);

    expect(pillars.map(p => [p.id, p.score])).toEqual([
      ['dev', 65],
      ['ops', 70],
      ['agile', 70],
    ]);
    expect(pillars[0].metrics.map(m => m.id)).toEqual([
      'ai',
      'collaboration',
      'kudos',
    ]);
  });

  it('takes the total as the average of the pillars', () => {
    expect(totalScore(groupByPillar(metrics))).toBe(68);
    expect(totalScore(groupByPillar([]))).toBeNull();
  });

  it('counts the areas that need attention', () => {
    expect(areasNeedingAttention(metrics)).toEqual({ count: 2, total: 5 });
  });

  it('colours scores like Agile Analytics', () => {
    expect(scoreTone(75)).toBe('success');
    expect(scoreTone(50)).toBe('warning');
    expect(scoreTone(49)).toBe('danger');
  });

  it('explains what an area is based on', () => {
    expect(areaBasis(metrics[2])).toBe(
      '22.5% of merge requests AI-assisted · full score at 50%',
    );
    expect(areaBasis(metrics[4])).toBe('Not set up yet, or nothing measured');
    expect(areaBasis({ id: 'delivery', score: 0, needs: 'jira_board' })).toBe(
      'Connect a Jira board to measure this',
    );
  });

  it('describes signals', () => {
    expect(
      describeSignal({
        kind: 'tier_dropped',
        metric: 'df',
        before: 4,
        after: 3,
      }),
    ).toEqual({
      text: 'Deployment frequency dropped from Elite to High',
      good: false,
      url: undefined,
    });
    expect(
      describeSignal({
        kind: 'stale_work',
        key: 'AGILE-1',
        age_days: 9,
        url: 'https://jira/AGILE-1',
      }),
    ).toEqual({
      text: 'AGILE-1 has been in progress for 9 days',
      good: false,
      url: 'https://jira/AGILE-1',
    });
    expect(
      describeSignal({
        kind: 'recovered',
        area: 'flow',
        before: 40,
        after: 72.5,
      }).good,
    ).toBe(true);
  });
});
