import {
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Grid,
  Link,
  Text,
} from '@backstage/ui';
import { useState } from 'react';
import type {
  CiQueue,
  DoraData,
  FailedDeployment,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import {
  DoraRepository,
  DoraSummary,
  dailyMeans,
  summariseDora,
} from '../../dora';
import {
  formatDate,
  formatDuration,
  formatNumber,
  repositoryName,
} from '../../format';
import { useAgileAnalytics } from '../../hooks';
import { areaUrl } from '../../links';
import { scopedPath, useScope } from '../../scope';
import { BarChart, Switch } from '../charts';
import { KpiTile } from '../KpiTile';
import { TimeChart, TimeSeries, seriesColor } from '../TimeChart';
import { DoraTile } from '../DoraTile';
import { LoadState } from '../LoadState';
import { ScopeBar } from '../ScopeBar';
import { SimpleTable } from '../SimpleTable';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const MAX_FAILURES = 10;
/** Repositories with a colour of their own; the rest share one. */
const MAX_COLOURED = 8;

type LeadTimeKind = 'lead_time_for_changes' | 'cycle_time' | 'lead_time';

const LEAD_TIME_KINDS: {
  value: LeadTimeKind;
  label: string;
  description: string;
}[] = [
  {
    value: 'lead_time_for_changes',
    label: 'Lead time for changes',
    description: 'from merge to production',
  },
  {
    value: 'cycle_time',
    label: 'Cycle time',
    description: 'from starting the ticket to production',
  },
  {
    value: 'lead_time',
    label: 'Lead time',
    description: 'from creating the ticket to production',
  },
];

const MEAN_COLOR = 'var(--bui-fg-primary)';

/** Dots per repository, the busiest in a colour of their own. */
function dotsPerRepository(
  points: { repository: string; time: number; value: number }[],
): TimeSeries[] {
  const byRepository = new Map<string, [number, number][]>();
  for (const point of points) {
    const name = repositoryName(point.repository);
    byRepository.set(name, [
      ...(byRepository.get(name) ?? []),
      [point.time * 1000, point.value],
    ]);
  }
  const ranked = [...byRepository].sort((a, b) => b[1].length - a[1].length);
  const rest = ranked.slice(MAX_COLOURED).flatMap(([, p]) => p);
  const series: TimeSeries[] = ranked
    .slice(0, MAX_COLOURED)
    .map(([name, p], i) => ({
      key: name,
      name,
      color: seriesColor(i),
      points: p,
      dots: true,
    }));
  if (rest.length) {
    series.push({
      key: '\u0000other',
      name: `${ranked.length - MAX_COLOURED} other repositories`,
      color: 'var(--bui-fg-secondary)',
      points: rest,
      dots: true,
    });
  }
  return series;
}

/** The DORA Elite and High limits, drawn once values come near them. */
function limits(longestHours: number, elite: number, high: number) {
  return [
    ...(longestHours > elite / 4
      ? [{ value: elite, label: 'Elite', color: 'var(--bui-fg-announcement)' }]
      : []),
    ...(longestHours > high / 2
      ? [{ value: high, label: 'High', color: 'var(--bui-fg-positive)' }]
      : []),
  ];
}

/**
 * Every change as a dot at the time it reached production, as high as its
 * lead or cycle time, with the mean per day, against the DORA Elite and High
 * limits, as in the DORA panel of Agile Analytics.
 */
const LeadTimeChart = ({ summary }: { summary: DoraSummary }) => {
  const [kind, setKind] = useState<LeadTimeKind>('lead_time_for_changes');
  const chosen = LEAD_TIME_KINDS.find(k => k.value === kind)!;
  const points = summary.changes.flatMap(change => {
    const seconds = change[kind];
    return typeof seconds === 'number'
      ? [
          {
            repository: change.repository,
            time: change.timestamp,
            value: seconds / 3600,
          },
        ]
      : [];
  });
  const means = dailyMeans(points);
  const series = dotsPerRepository(points);
  if (!summary.changes.length) return null;
  if (points.length) {
    series.push({
      key: '\u0000mean',
      name: 'Mean per day',
      color: MEAN_COLOR,
      points: means,
    });
  }
  const longest = Math.max(0, ...points.map(p => p.value));
  const mean = points.length
    ? points.reduce((sum, p) => sum + p.value, 0) / points.length
    : null;

  return (
    <Card>
      <CardHeader>
        <Flex
          justify="between"
          align="start"
          gap="3"
          style={{ flexWrap: 'wrap' }}
        >
          <Flex direction="column" gap="1">
            <Text variant="title-small" as="h2">
              {chosen.label}
            </Text>
            <Text variant="body-small" color="secondary">
              Each dot is a change, {chosen.description}; the mean is{' '}
              {formatDuration(mean === null ? null : mean * 3600)}.
              {kind === 'lead_time_for_changes'
                ? ' Under a day is DORA Elite, under a week High.'
                : ''}
            </Text>
          </Flex>
          <Switch
            label="Which time"
            options={LEAD_TIME_KINDS}
            value={kind}
            onChange={setKind}
          />
        </Flex>
      </CardHeader>
      <CardBody>
        {points.length ? (
          <TimeChart
            series={series}
            title={`${chosen.label} of ${points.length} changes`}
            formatValue={hours => formatDuration(hours * 3600)}
            fromZero
            domain={[summary.period.start * 1000, summary.period.end * 1000]}
            // A limit is only drawn when changes come near it, so that short
            // times are not squashed at the bottom
            references={
              kind === 'lead_time_for_changes' ? limits(longest, 24, 168) : []
            }
            height={240}
          />
        ) : (
          <Text color="secondary">
            No {chosen.label.toLowerCase()} known for the changes of this
            period; it needs the Jira tickets of the changes.
          </Text>
        )}
      </CardBody>
    </Card>
  );
};

/** How long each failed deployment took to restore, with the mean per day. */
const RestoreChart = ({ summary }: { summary: DoraSummary }) => {
  const points = summary.restores.map(r => ({
    repository: r.repository,
    time: r.time,
    value: r.hours,
  }));
  const series = dotsPerRepository(points);
  if (points.length > 1) {
    series.push({
      key: '\u0000mean',
      name: 'Mean per day',
      color: MEAN_COLOR,
      points: dailyMeans(points),
    });
  }
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          Time to restore
        </Text>
        <Text variant="body-small" color="secondary">
          Each dot is a failed deployment, at the time it was fixed in
          production. Under an hour is DORA Elite, under a day High.
        </Text>
      </CardHeader>
      <CardBody>
        {points.length ? (
          <TimeChart
            series={series}
            title={`Time to restore of ${points.length} failed deployments`}
            formatValue={hours => formatDuration(hours * 3600)}
            fromZero
            domain={[summary.period.start * 1000, summary.period.end * 1000]}
            references={limits(Math.max(...points.map(p => p.value)), 1, 24)}
            height={200}
          />
        ) : (
          <Text color="secondary">
            No failed deployments restored in this period.
          </Text>
        )}
      </CardBody>
    </Card>
  );
};

/** The share of production deployments per day that needed a fix. */
const FailureRateChart = ({ summary }: { summary: DoraSummary }) => {
  const points: [number, number | null][] = summary.days.map(day => [
    (day.start + 43_200) * 1000,
    day.deployments
      ? (Math.min(day.failed, day.deployments) / day.deployments) * 100
      : null,
  ]);
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          Change failure rate per day
        </Text>
        <Text variant="body-small" color="secondary">
          The production deployments of each day that needed a fix; days without
          deployments are left open. Up to 5% is DORA Elite, up to 10% High.
        </Text>
      </CardHeader>
      <CardBody>
        {points.some(p => p[1] !== null) ? (
          <TimeChart
            series={[
              {
                key: 'cfr',
                name: 'Change failure rate',
                color: 'var(--bui-fg-negative)',
                points,
              },
            ]}
            title="Change failure rate per day"
            formatValue={v => `${formatNumber(v, 0)}%`}
            fromZero
            legend={false}
            domain={[summary.period.start * 1000, summary.period.end * 1000]}
            references={[
              { value: 5, label: 'Elite', color: 'var(--bui-fg-announcement)' },
              { value: 10, label: 'High', color: 'var(--bui-fg-positive)' },
            ]}
            height={200}
          />
        ) : (
          <Text color="secondary">
            No production deployments in this period.
          </Text>
        )}
      </CardBody>
    </Card>
  );
};

/** A wait in the unit that reads best: 0.4 s, 12 s, 3.4 min, 1.2 h. */
export function formatWait(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '–';
  if (seconds < 10) return `${Number(seconds.toFixed(1))} s`;
  if (seconds < 59.5) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Number((seconds / 60).toFixed(1))} min`;
  return `${Number((seconds / 3600).toFixed(1))} h`;
}

/** How long CI jobs waited for a runner, as the CI queue card of Agile Analytics. */
const CiQueueCard = ({ days, team }: { days: number; team?: string }) => {
  const queue = useAgileAnalytics<CiQueue | null>(
    scopedPath('dora/ci-queue', { days }),
  );
  const summary = queue.value?.summary;
  const series = queue.value?.series ?? [];
  const threshold = formatWait(queue.value?.threshold_seconds ?? 60);
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          CI queue
        </Text>
        <Text variant="body-small" color="secondary">
          How long CI jobs waited for a runner
          {team ? ', for the whole organisation' : ''}.
        </Text>
      </CardHeader>
      <CardBody>
        <LoadState
          loading={queue.loading}
          error={queue.error}
          what="the CI queue"
          height={260}
          isEmpty={!summary?.jobs}
          empty="No CI jobs in this period."
        >
          {() => (
            <Flex direction="column" gap="4">
              <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
                <KpiTile label="Median wait" value={formatWait(summary!.p50)} />
                <KpiTile
                  label="90th percentile"
                  value={formatWait(summary!.p90)}
                />
                <KpiTile
                  label={`Waited over ${threshold}`}
                  value={formatNumber(summary!.waiting_jobs ?? 0, 0)}
                  hint={`of ${formatNumber(summary!.jobs ?? 0, 0)} jobs`}
                />
                <KpiTile
                  label="Total wait"
                  value={formatWait(summary!.wait_seconds)}
                  hint="all jobs together"
                />
              </Grid.Root>
              <TimeChart
                series={[
                  {
                    key: 'p50',
                    name: 'Median wait',
                    color: seriesColor(1),
                    points: series.map(b => [b.start * 1000, b.p50 ?? null]),
                  },
                  {
                    key: 'p90',
                    name: '90th percentile',
                    color: 'var(--bui-fg-negative)',
                    points: series.map(b => [b.start * 1000, b.p90 ?? null]),
                  },
                ]}
                title="CI wait per bucket, median and 90th percentile"
                formatValue={formatWait}
                fromZero
                height={180}
              />
              <Flex direction="column" gap="2">
                <Text variant="body-small" color="secondary">
                  Jobs that waited over {threshold}
                </Text>
                <BarChart
                  title={`CI jobs that waited over ${threshold}`}
                  bars={series.map(b => ({
                    label: formatDate(b.start),
                    values: [b.waiting_jobs ?? 0],
                  }))}
                  series={[
                    { label: `Waited over ${threshold}`, tone: 'warning' },
                  ]}
                  height={80}
                />
              </Flex>
            </Flex>
          )}
        </LoadState>
      </CardBody>
    </Card>
  );
};

const FailureRow = ({ failure }: { failure: FailedDeployment }) => {
  const fixes = (failure.remediations ?? [])
    .map(r => r.title || r.source_branch)
    .filter(Boolean);
  const alerts = (failure.slo_alerts ?? []).map(
    a => `${a.service}: ${a.slo_name}`,
  );
  return (
    <Flex direction="column" gap="1">
      <Flex justify="between" gap="2" align="baseline">
        <Text weight="bold" truncate>
          {repositoryName(failure.repository)}
        </Text>
        <Text
          variant="body-small"
          color={failure.restored_at ? 'secondary' : 'danger'}
        >
          {failure.restored_at
            ? `Restored in ${formatDuration(failure.time_to_restore)}`
            : 'Not restored yet'}
        </Text>
      </Flex>
      <Text variant="body-x-small" color="secondary">
        Deployed {formatDate(failure.timestamp)}
        {failure.environment ? ` to ${failure.environment}` : ''}
        {fixes.length ? ` · fixed by ${fixes.join(', ')}` : ''}
        {alerts.length ? ` · SLO alerts: ${alerts.join(', ')}` : ''}
      </Text>
    </Flex>
  );
};

/** The four DORA metrics, deployments per day and the repositories behind them. */
export const DoraPage = () => {
  const { team, days } = useScope();
  const data = useAgileAnalytics<DoraData>(scopedPath('dora', { days, team }));
  const summary = data.value ? summariseDora(data.value) : undefined;

  return (
    <Container>
      <Flex direction="column" gap="4" py="4">
        <ScopeBar
          note={
            team
              ? 'Lead time and failures are matched to the repositories the team deployed from.'
              : undefined
          }
        />
        <LoadState
          loading={data.loading}
          error={data.error}
          what="the DORA metrics"
          height={420}
          isEmpty={
            !!summary &&
            !summary.productionDeployments &&
            !summary.failedDeployments.length
          }
          empty={
            <>
              No production deployments in the last {days} days.{' '}
              <Link href={areaUrl('delivery')!} {...external}>
                Check the deployment set-up in Agile Analytics
              </Link>
              .
            </>
          }
        >
          {() => (
            <>
              <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
                <DoraTile id="df" value={summary!.deploymentFrequency} />
                <DoraTile id="lt" value={summary!.leadTime} />
                <DoraTile id="mttr" value={summary!.timeToRestore} />
                <DoraTile id="cfr" value={summary!.changeFailureRate} />
              </Grid.Root>

              <Card>
                <CardHeader>
                  <Text variant="title-small" as="h2">
                    Deployments per day
                  </Text>
                  <Text variant="body-small" color="secondary">
                    {summary!.productionDeployments} production deployments and{' '}
                    {summary!.failedDeployments.length} that needed a fix
                  </Text>
                </CardHeader>
                <CardBody>
                  <BarChart
                    title={`Production deployments per day over the last ${days} days`}
                    bars={summary!.days.map(day => ({
                      label: formatDate(day.start),
                      values: [day.deployments - day.failed, day.failed].map(
                        v => Math.max(0, v),
                      ),
                    }))}
                    series={[
                      { label: 'Deployed', tone: 'success' },
                      { label: 'Needed a fix', tone: 'danger' },
                    ]}
                  />
                </CardBody>
              </Card>

              <LeadTimeChart summary={summary!} />

              <Grid.Root columns={{ initial: '1', md: '2' }} gap="4">
                <RestoreChart summary={summary!} />
                <FailureRateChart summary={summary!} />
              </Grid.Root>

              <CiQueueCard days={days} team={team} />

              <Grid.Root columns={{ initial: '1', md: '2' }} gap="4">
                <Card>
                  <CardHeader>
                    <Text variant="title-small" as="h2">
                      Repositories
                    </Text>
                    <Text variant="body-small" color="secondary">
                      Most deployed first; lead time is the median from merge to
                      production
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <SimpleTable<DoraRepository>
                      label="DORA metrics per repository"
                      rows={summary!.repositories}
                      rowKey={r => r.repository}
                      columns={[
                        {
                          key: 'repository',
                          label: 'Repository',
                          render: r => r.repository,
                        },
                        {
                          key: 'deployments',
                          label: 'Deploys',
                          align: 'right',
                          render: r => r.deployments,
                        },
                        {
                          key: 'cfr',
                          label: 'Failure rate',
                          align: 'right',
                          render: r =>
                            r.changeFailureRate === null
                              ? '–'
                              : `${formatNumber(r.changeFailureRate, 1)}%`,
                        },
                        {
                          key: 'lt',
                          label: 'Lead time',
                          align: 'right',
                          render: r => formatDuration(r.leadTime),
                        },
                      ]}
                    />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Text variant="title-small" as="h2">
                      Deployments that needed a fix
                    </Text>
                    <Text variant="body-small" color="secondary">
                      Found from hotfixes, reverts and SLO alerts right after a
                      deployment
                    </Text>
                  </CardHeader>
                  <CardBody>
                    {summary!.failedDeployments.length ? (
                      <Flex direction="column" gap="3">
                        {summary!.failedDeployments
                          .slice(0, MAX_FAILURES)
                          .map(failure => (
                            <FailureRow
                              key={`${failure.repository}-${failure.timestamp}`}
                              failure={failure}
                            />
                          ))}
                      </Flex>
                    ) : (
                      <Text color="secondary">
                        No failed deployments in this period.
                      </Text>
                    )}
                  </CardBody>
                </Card>
              </Grid.Root>
            </>
          )}
        </LoadState>
      </Flex>
    </Container>
  );
};
