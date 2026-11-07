import type { TrendBucket } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { compareRecent, describeChange } from './trends';

const bucket = (overrides: Partial<TrendBucket>): TrendBucket => ({
  start: 0,
  days: 7,
  partial: false,
  merged: 0,
  ai_assisted: 0,
  not_ai_assisted: 0,
  unattributed: 0,
  ai_share: null,
  deployments: 0,
  failed_deployments: 0,
  deployment_frequency: null,
  change_failure_rate: null,
  lead_time_for_changes: null,
  ...overrides,
});

describe('trends', () => {
  it('compares the last four complete weeks with the four before', () => {
    const buckets = [
      ...Array.from({ length: 4 }, () =>
        bucket({
          deployments: 7,
          failed_deployments: 1,
          lead_time_for_changes: 7200,
        }),
      ),
      ...Array.from({ length: 4 }, () =>
        bucket({
          deployments: 14,
          ai_assisted: 1,
          not_ai_assisted: 1,
          lead_time_for_changes: 3600,
        }),
      ),
      bucket({ partial: true, days: 2, deployments: 100 }),
    ];

    const { recent, previous } = compareRecent(buckets);

    expect(recent).toEqual({
      deploymentFrequency: 2,
      leadTime: 3600,
      changeFailureRate: 0,
      aiShare: 0.5,
    });
    expect(previous?.deploymentFrequency).toBe(1);
    expect(previous?.changeFailureRate).toBeCloseTo(1 / 7);
    expect(previous?.aiShare).toBeNull();
  });

  it('words changes with a tone for which way is better', () => {
    expect(describeChange(2, 1, true)).toEqual({
      text: 'Up 100%',
      tone: 'success',
    });
    expect(describeChange(3600, 7200, false)).toEqual({
      text: 'Down 50%',
      tone: 'success',
    });
    expect(describeChange(1.02, 1, true)?.text).toBe('Unchanged');
    expect(describeChange(1, 0, false)).toEqual({
      text: 'Up from none',
      tone: 'danger',
    });
    expect(describeChange(1, null, true)).toBeUndefined();
  });
});
