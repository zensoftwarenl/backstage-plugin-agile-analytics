import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Link,
  Select,
  Skeleton,
  Text,
} from '@backstage/ui';
import { useState } from 'react';
import type {
  Deployment,
  DoraData,
  ErrorBudgetSeries,
  SloReport,
  SloReportMetric,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { ResponseError } from '@backstage/errors';
import { useDeepLinkScroll } from '../../deepLink';
import { useAgileAnalytics } from '../../hooks';
import { errorBudgetSettingsUrl } from '../../links';
import { scopedPath, useScope } from '../../scope';
import { formatDate, repositoryName } from '../../format';
import {
  budgetSeriesFinder,
  formatPercent,
  formatTarget,
  slosOfTeam,
  summariseSlos,
} from '../../slos';
import { ScopeBar } from '../ScopeBar';
import { SloRow } from '../SloRow';
import { BarChart } from '../charts';
import { TimeChart, TimeMarker, TimeSeries, seriesColor } from '../TimeChart';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

/**
 * Production deployments as markers, one per day with how many and from
 * where, as the numbered markers of the error budget charts of Agile
 * Analytics.
 */
export function deploymentMarkers(deployments: Deployment[]): TimeMarker[] {
  const days = new Map<number, Deployment[]>();
  for (const deployment of deployments) {
    if (!deployment.production) continue;
    const day = Math.floor(deployment.timestamp / 86_400) * 86_400;
    days.set(day, [...(days.get(day) ?? []), deployment]);
  }
  return [...days]
    .sort((a, b) => a[0] - b[0])
    .map(([day, all]) => {
      const repositories = [
        ...new Set(all.map(d => repositoryName(d.repository))),
      ];
      return {
        time: (day + 43_200) * 1000,
        label: `${all.length} deployment${
          all.length === 1 ? '' : 's'
        } on ${formatDate(day)}: ${repositories.slice(0, 3).join(', ')}${
          repositories.length > 3 ? ` and ${repositories.length - 3} more` : ''
        }`,
        color: 'var(--bui-fg-secondary)',
      };
    });
}

/**
 * The error budget and the good and bad events of every SLO over time, one line per
 * SLO, as on the SRE page of Agile Analytics.
 */
const BudgetsOverTime = ({
  slos,
  seriesOf,
  days,
  deployments,
}: {
  slos: SloReportMetric[];
  seriesOf: (slo: SloReportMetric) => ErrorBudgetSeries | undefined;
  days: number;
  deployments: Deployment[];
}) => {
  const [chosen, setChosen] = useState<string | null>(null);
  const lines = slos.flatMap((slo, i) => {
    const series = seriesOf(slo);
    return series?.data?.length ? [{ slo, series, color: seriesColor(i) }] : [];
  });
  if (!lines.length) return null;
  const name = (slo: SloReportMetric) =>
    `${slo.sloName ?? 'Unnamed SLO'}${slo.service ? ` · ${slo.service}` : ''}`;
  const description = (series: ErrorBudgetSeries) =>
    `Target ${formatTarget(series.slo_target)}${
      series.slo_description ? `: ${series.slo_description}` : ''
    }`;
  const budget: TimeSeries[] = lines.map(({ slo, series, color }) => ({
    key: String(slo.id),
    name: name(slo),
    color,
    description: description(series),
    points: series.data.map(([t, remaining]) => [t * 1000, remaining]),
  }));
  const withEvents = lines.filter(({ series }) =>
    series.data.some(([, , events]) => events),
  );
  const events =
    withEvents.find(({ slo }) => String(slo.id) === chosen) ?? withEvents[0];

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          Error budget over time
        </Text>
        <Text variant="body-small" color="secondary">
          The budget left of each SLO over the last {days} days; below the
          dashed line the SLO is over budget. The dots on top are production
          deployments. Click a name to hide or show it.
        </Text>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap="5">
          <TimeChart
            series={budget}
            title={`Error budget left of ${lines.length} SLOs over the last ${days} days`}
            formatValue={v => formatPercent(v)}
            zeroLine
            markers={deploymentMarkers(deployments)}
            markersLabel="Deployments"
            height={260}
          />
          {events ? (
            <Flex direction="column" gap="2">
              <Flex
                justify="between"
                align="center"
                gap="3"
                style={{ flexWrap: 'wrap' }}
              >
                <Flex direction="column" gap="1">
                  <Text variant="title-x-small" as="h3">
                    Good and bad events
                  </Text>
                  <Text variant="body-small" color="secondary">
                    The requests or checks that met and missed the SLO, per day,
                    each on its own scale.
                  </Text>
                </Flex>
                {withEvents.length > 1 ? (
                  <Select
                    label="SLO"
                    size="small"
                    options={withEvents.map(({ slo }) => ({
                      value: String(slo.id),
                      label: name(slo),
                    }))}
                    selectedKey={String(events.slo.id)}
                    onSelectionChange={key => key && setChosen(String(key))}
                  />
                ) : null}
              </Flex>
              {(['good_events', 'bad_events'] as const).map(kind => (
                <BarChart
                  key={kind}
                  // Each on a scale of its own, else the few bad events
                  // vanish under the many good ones
                  title={`${
                    kind === 'good_events' ? 'Good' : 'Bad'
                  } events of ${name(events.slo)} per day`}
                  bars={events.series.data.map(([t, , e]) => ({
                    label: formatDate(t),
                    values: [e?.[kind] ?? 0],
                  }))}
                  series={[
                    kind === 'good_events'
                      ? { label: 'Good events', tone: 'success' }
                      : { label: 'Bad events', tone: 'danger' },
                  ]}
                  height={kind === 'good_events' ? 70 : 90}
                />
              ))}
            </Flex>
          ) : null}
        </Flex>
      </CardBody>
    </Card>
  );
};

/** The SLOs from the last SLO report, with the lowest error budgets first. */
export const ErrorBudgetsPage = () => {
  const { team, days } = useScope();
  useDeepLinkScroll();
  const report = useAgileAnalytics<SloReport | null>('slos');
  const budgets = useAgileAnalytics<ErrorBudgetSeries[]>(
    scopedPath('slos/budgets', { days }),
  );
  const dora = useAgileAnalytics<DoraData>(scopedPath('dora', { days, team }));
  const summary = summariseSlos(slosOfTeam(report.value?.metrics, team));
  const seriesOf = budgetSeriesFinder(budgets.value);
  // Agile Analytics answers 404 until it has made a first SLO report
  const noReport =
    report.error instanceof ResponseError && report.error.statusCode === 404;

  let content;
  if (report.loading) {
    content = <Skeleton width="100%" height={320} />;
  } else if (report.error && !noReport) {
    content = (
      <Alert
        status="danger"
        title="Could not load the error budgets"
        description={report.error.message}
      />
    );
  } else if (!summary.total) {
    content = (
      <Card>
        <CardBody>
          <Text color="secondary">
            {team
              ? 'This team has no error budgets yet. '
              : 'No error budgets yet. '}
            <Link href={errorBudgetSettingsUrl()} {...external}>
              Set up SLOs in Agile Analytics
            </Link>{' '}
            and they show up here after the next nightly report.
          </Text>
        </CardBody>
      </Card>
    );
  } else {
    content = (
      <>
        <BudgetsOverTime
          slos={summary.lowest}
          seriesOf={seriesOf}
          days={days}
          deployments={dora.value?.deployments ?? []}
        />
        <Card>
          <CardHeader>
            <Flex justify="between" align="center">
              <Flex direction="column" gap="1">
                <Text variant="title-small" as="h2">
                  Error budgets
                </Text>
                <Text variant="body-small" color="secondary">
                  How much room each SLO has left before it breaks its target,
                  lowest first. The line shows the budget over the last {days}{' '}
                  days.
                </Text>
              </Flex>
              <Flex direction="column" align="end" gap="1">
                <Text
                  variant="title-large"
                  weight="bold"
                  aria-label={`${summary.onTarget} of ${summary.total} SLOs on target`}
                >
                  {summary.onTarget}/{summary.total}
                </Text>
                <Text
                  variant="body-small"
                  color={summary.overBudget ? 'danger' : 'success'}
                >
                  {summary.overBudget
                    ? `${summary.overBudget} over budget`
                    : 'All within budget'}
                </Text>
              </Flex>
            </Flex>
          </CardHeader>
          <CardBody>
            <Flex direction="column" gap="5">
              {budgets.error ? (
                <Alert
                  status="warning"
                  title="Could not load the error budgets over time"
                  description={budgets.error.message}
                />
              ) : null}
              {summary.lowest.map(slo => (
                <SloRow
                  key={slo.id}
                  slo={slo}
                  series={seriesOf(slo)}
                  linkable
                />
              ))}
            </Flex>
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <Container>
      <Flex direction="column" gap="4" py="4">
        <ScopeBar note="Budgets left are from the last nightly SLO report." />
        {content}
      </Flex>
    </Container>
  );
};
