import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Link,
  Skeleton,
  Text,
} from '@backstage/ui';
import type {
  ErrorBudgetSeries,
  SloReport,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { ResponseError } from '@backstage/errors';
import { useDeepLinkScroll } from '../../deepLink';
import { useAgileAnalytics } from '../../hooks';
import { errorBudgetSettingsUrl } from '../../links';
import { scopedPath, useScope } from '../../scope';
import { budgetSeriesFinder, slosOfTeam, summariseSlos } from '../../slos';
import { ScopeBar } from '../ScopeBar';
import { SloRow } from '../SloRow';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** The SLOs from the last SLO report, with the lowest error budgets first. */
export const ErrorBudgetsPage = () => {
  const { team, days } = useScope();
  useDeepLinkScroll();
  const report = useAgileAnalytics<SloReport | null>('slos');
  const budgets = useAgileAnalytics<ErrorBudgetSeries[]>(
    scopedPath('slos/budgets', { days }),
  );
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
              <SloRow key={slo.id} slo={slo} series={seriesOf(slo)} linkable />
            ))}
          </Flex>
        </CardBody>
      </Card>
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
