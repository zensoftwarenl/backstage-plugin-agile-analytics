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
import type {
  TicketSplit,
  FlowItem,
  HoursInvestment,
  SprintReport,
  SprintResult,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { formatNumber } from '../../format';
import { useAgileAnalytics } from '../../hooks';
import { areaUrl } from '../../links';
import { AGE_BUCKETS, recentSprints } from '../../sprints';
import { scopedPath, useScope } from '../../scope';
import { BarChart, CompareBars, Donut } from '../charts';
import { ScopeBar } from '../ScopeBar';
import { KpiTile } from '../KpiTile';
import { LoadState } from '../LoadState';
import { SimpleTable } from '../SimpleTable';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const MAX_OLDEST = 10;
const MAX_PROJECTS = 15;

const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? '–' : `${formatNumber(value, 1)}%`;

const days = (value: number | null | undefined) =>
  value === null || value === undefined
    ? '–'
    : `${formatNumber(value)} ${value === 1 ? 'day' : 'days'}`;

function predictabilityHint(
  predictability: SprintReport['predictability'],
): string {
  if (!predictability) return 'No Jira boards linked';
  if (predictability.score === null) {
    return `Needs ${predictability.min_sprints} closed sprints`;
  }
  const n = predictability.sprints.length;
  return `Mean over ${n} ${n === 1 ? 'sprint' : 'sprints'}`;
}

const ItemKey = ({ item }: { item: FlowItem }) =>
  item.url ? (
    <Link href={item.url} {...external}>
      {item.key}
    </Link>
  ) : (
    <>{item.key}</>
  );

const SprintsCard = ({ report }: { report: SprintReport }) => {
  const sprints = recentSprints(report);
  const predictability = report.predictability;
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          Sprints
        </Text>
        <Text variant="body-small" color="secondary">
          What was in a sprint at its start against what got done by its end,
          over the last {predictability?.lookback_days ?? 90} days
        </Text>
      </CardHeader>
      <CardBody>
        {sprints.length ? (
          <Flex direction="column" gap="4">
            <BarChart
              title="Committed and completed work per sprint"
              bars={sprints.map(s => ({
                label: s.name,
                values: [
                  s.completed,
                  Math.max(0, s.committed - s.completed),
                  s.added,
                ],
              }))}
              series={[
                { label: 'Completed', tone: 'success' },
                { label: 'Not completed', tone: 'warning' },
                { label: 'Added later', tone: 'info' },
              ]}
            />
            <SimpleTable<SprintResult>
              label="Sprints"
              rows={[...sprints].reverse()}
              rowKey={s => `${s.board_id}-${s.sprint_id}`}
              columns={[
                {
                  key: 'sprint',
                  label: 'Sprint',
                  render: s =>
                    s.url ? (
                      <Link href={s.url} {...external}>
                        {s.name}
                      </Link>
                    ) : (
                      s.name
                    ),
                },
                { key: 'board', label: 'Board', render: s => s.board },
                {
                  key: 'committed',
                  label: 'Committed',
                  align: 'right',
                  render: s => s.committed,
                },
                {
                  key: 'completed',
                  label: 'Completed',
                  align: 'right',
                  render: s => s.completed,
                },
                {
                  key: 'added',
                  label: 'Added',
                  align: 'right',
                  render: s =>
                    s.added ? `${s.added} (${s.added_completed} done)` : 0,
                },
                {
                  key: 'predictability',
                  label: 'Predictability',
                  align: 'right',
                  render: s => percent(s.predictability),
                },
              ]}
            />
          </Flex>
        ) : (
          <Text color="secondary">
            No closed sprints yet. Link Jira boards to teams in Agile Analytics
            to see them.
          </Text>
        )}
      </CardBody>
    </Card>
  );
};

const FlowCard = ({ flow }: { flow: NonNullable<SprintReport['flow']> }) => {
  const counts = new Map(flow.buckets.map(b => [b.id, b.count]));
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          Work in progress by age
        </Text>
        <Text variant="body-small" color="secondary">
          Days since each item moved to in progress
        </Text>
      </CardHeader>
      <CardBody>
        <CompareBars
          rows={AGE_BUCKETS.map(b => ({
            label: b.label,
            value: counts.get(b.id) ?? 0,
            tone: b.tone,
          }))}
          format={v => formatNumber(v)}
        />
      </CardBody>
    </Card>
  );
};

const OldestCard = ({ flow }: { flow: NonNullable<SprintReport['flow']> }) => (
  <Card>
    <CardHeader>
      <Text variant="title-small" as="h2">
        Oldest work in progress
      </Text>
      <Text variant="body-small" color="secondary">
        Worth a look at the next stand-up
      </Text>
    </CardHeader>
    <CardBody>
      <SimpleTable<FlowItem>
        label="Oldest work in progress"
        rows={flow.oldest.slice(0, MAX_OLDEST)}
        rowKey={item => item.key}
        empty="Nothing in progress."
        columns={[
          {
            key: 'key',
            label: 'Item',
            render: item => <ItemKey item={item} />,
          },
          { key: 'summary', label: 'Summary', render: item => item.summary },
          { key: 'status', label: 'Status', render: item => item.status },
          {
            key: 'age',
            label: 'Age',
            align: 'right',
            render: item => days(item.age_days),
          },
        ]}
      />
    </CardBody>
  </Card>
);

type ProjectRow = HoursInvestment['metrics'][number];

const HoursCard = () => {
  const hours = useAgileAnalytics<HoursInvestment | null>('hours');
  const projects = [...(hours.value?.metrics ?? [])]
    .sort((a, b) => b.hours - a.hours)
    .slice(0, MAX_PROJECTS);
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          Hours per project
        </Text>
        <Text variant="body-small" color="secondary">
          Booked over the last two weeks, against the two weeks before
        </Text>
      </CardHeader>
      <CardBody>
        <LoadState
          loading={hours.loading}
          error={hours.error}
          what="the hours"
          isEmpty={!projects.length}
          empty={
            <>
              No hours booked yet.{' '}
              <Link href={areaUrl('investment')!} {...external}>
                Book hours in Agile Analytics
              </Link>
              .
            </>
          }
        >
          {() => (
            <SimpleTable<ProjectRow>
              label="Hours per project"
              rows={projects}
              rowKey={p => String(p.id)}
              columns={[
                { key: 'project', label: 'Project', render: p => p.project },
                {
                  key: 'hours',
                  label: 'Hours',
                  align: 'right',
                  render: p => formatNumber(p.hours),
                },
                {
                  key: 'share',
                  label: 'Share',
                  align: 'right',
                  render: p => percent(p.percentage),
                },
                {
                  key: 'trend',
                  label: 'Change',
                  align: 'right',
                  render: p =>
                    p.trend === null || p.trend === undefined
                      ? '–'
                      : `${p.trend > 0 ? '+' : ''}${formatNumber(p.trend)} h`,
                },
              ]}
            />
          )}
        </LoadState>
      </CardBody>
    </Card>
  );
};

/**
 * Sprint predictability, the flow of work in progress and where hours go:
 * the AgileEx part of the health report.
 */
const FEATURE_COLOR = '#1fb8d3';
const OTHER_COLOR = '#f2a33a';

/**
 * Tickets done in the period, features against other work, by count and by
 * hours booked, as the Sprint Insights pies of Agile Analytics.
 */
const TicketTypesCard = () => {
  const { team, days: period } = useScope();
  const split = useAgileAnalytics<TicketSplit>(
    scopedPath('sprints/tickets', { days: period, team }),
  );
  const value = split.value;
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          Features and other work
        </Text>
        <Text variant="body-small" color="secondary">
          Tickets done in the last {period} days{team ? ' by the team' : ''}, as
          Sprint Insights labels them.
          {value?.truncated ? ' Only the first 5,000 tickets are counted.' : ''}
        </Text>
      </CardHeader>
      <CardBody>
        <LoadState
          loading={split.loading}
          error={split.error}
          what="the ticket types"
          isEmpty={!value || !(value.features + value.notFeatures)}
          empty={`No tickets done in the last ${period} days.`}
        >
          {() => (
            <Grid.Root columns={{ initial: '1', md: '2' }} gap="4">
              <Flex direction="column" gap="2">
                <Text variant="title-x-small" as="h3">
                  Tickets
                </Text>
                <Donut
                  title="Tickets done per type"
                  slices={[
                    {
                      label: 'Features',
                      value: value!.features,
                      color: FEATURE_COLOR,
                    },
                    {
                      label: 'Other work',
                      value: value!.notFeatures,
                      color: OTHER_COLOR,
                    },
                  ]}
                  format={v => formatNumber(v, 0)}
                />
              </Flex>
              <Flex direction="column" gap="2">
                <Text variant="title-x-small" as="h3">
                  Hours booked
                </Text>
                <Donut
                  title="Hours booked per type"
                  slices={[
                    {
                      label: 'Features',
                      value: value!.featureHours,
                      color: FEATURE_COLOR,
                    },
                    {
                      label: 'Other work',
                      value: value!.notFeatureHours,
                      color: OTHER_COLOR,
                    },
                  ]}
                  format={v => `${formatNumber(v, 0)} h`}
                />
              </Flex>
            </Grid.Root>
          )}
        </LoadState>
      </CardBody>
    </Card>
  );
};

export const SprintsPage = () => {
  const report = useAgileAnalytics<SprintReport | null>('sprints');
  const flow = report.value?.flow;
  const predictability = report.value?.predictability;

  return (
    <Container>
      <Flex direction="column" gap="4" py="4">
        <ScopeBar note="The team and period apply to the ticket types; the sprint report is last night's, for the whole organisation." />
        <TicketTypesCard />
        <LoadState
          loading={report.loading}
          error={report.error}
          what="the sprint report"
          height={320}
          isEmpty={!flow && !predictability}
          empty={
            <>
              No sprint report yet; it needs a Jira connection.{' '}
              <Link href={areaUrl('flow')!} {...external}>
                Set it up in Agile Analytics
              </Link>
              .
            </>
          }
        >
          {() => (
            <>
              <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
                <KpiTile
                  label="Predictability"
                  value={percent(predictability?.score)}
                  hint={predictabilityHint(predictability)}
                />
                <KpiTile
                  label="Flowing work"
                  value={percent(flow?.young_share)}
                  hint={
                    flow
                      ? `In progress under ${days(flow.young_days)}`
                      : undefined
                  }
                />
                <KpiTile
                  label="Work in progress"
                  value={formatNumber(flow?.items)}
                  hint={
                    flow ? `Median age ${days(flow.median_days)}` : undefined
                  }
                />
                <KpiTile
                  label="Abandoned"
                  value={formatNumber(flow?.abandoned)}
                  tone={flow?.abandoned ? 'warning' : undefined}
                  hint={
                    flow
                      ? `In progress, untouched for ${days(
                          flow.abandoned_days,
                        )}`
                      : undefined
                  }
                />
              </Grid.Root>
              {predictability ? <SprintsCard report={report.value!} /> : null}
              {flow ? (
                <Grid.Root columns={{ initial: '1', md: '2' }} gap="4">
                  <FlowCard flow={flow} />
                  <OldestCard flow={flow} />
                </Grid.Root>
              ) : null}
            </>
          )}
        </LoadState>
        <HoursCard />
      </Flex>
    </Container>
  );
};
