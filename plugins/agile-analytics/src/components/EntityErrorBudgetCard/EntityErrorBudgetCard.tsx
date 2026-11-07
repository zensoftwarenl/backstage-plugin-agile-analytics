import { ResponseError } from '@backstage/errors';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Link,
  Skeleton,
  Text,
} from '@backstage/ui';
import type { SloReport } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import {
  AGILE_ANALYTICS_SERVICE_ANNOTATION,
  agileAnalyticsService,
} from '../../entity';
import { useAgileAnalytics } from '../../hooks';
import { errorBudgetSettingsUrl, errorBudgetsUrl } from '../../links';
import { summariseSlos } from '../../slos';
import { SloRow } from '../SloRow';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** The error budgets of the Agile Analytics service an entity is linked to. */
export const EntityErrorBudgetCard = () => {
  const { entity } = useEntity();
  const service = agileAnalyticsService(entity);
  const report = useAgileAnalytics<SloReport>(service ? 'slos' : undefined);
  // Service names on SLOs are matched the way the error budget page anchors them
  const summary = summariseSlos(
    report.value?.metrics?.filter(
      slo => slo.service?.toLowerCase() === service?.toLowerCase(),
    ),
  );
  // Agile Analytics answers 404 until it has made a first SLO report
  const noReport =
    report.error instanceof ResponseError && report.error.statusCode === 404;

  let content;
  if (!service) {
    content = (
      <Text color="secondary">
        Add the <code>{AGILE_ANALYTICS_SERVICE_ANNOTATION}</code> annotation to
        show this service's error budgets.
      </Text>
    );
  } else if (report.loading) {
    content = <Skeleton width="100%" height={120} />;
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
      <Text color="secondary">
        Agile Analytics has no SLOs for <strong>{service}</strong> yet.{' '}
        <Link href={errorBudgetSettingsUrl()} {...external}>
          Set them up in Agile Analytics
        </Link>
        .
      </Text>
    );
  } else {
    content = (
      <Flex direction="column" gap="4">
        {summary.lowest.map(slo => (
          <SloRow key={slo.id} slo={slo} showService={false} />
        ))}
      </Flex>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Flex justify="between" align="center" gap="2">
          <Flex direction="column" gap="1">
            <Text variant="title-x-small" as="h2">
              Error budget
            </Text>
            {summary.total ? (
              <Text
                variant="body-small"
                color={summary.overBudget ? 'danger' : 'success'}
              >
                {summary.overBudget
                  ? `${summary.overBudget} of ${summary.total} over budget`
                  : `${summary.onTarget} of ${summary.total} on target`}
              </Text>
            ) : null}
          </Flex>
          {service ? (
            <Link
              href={errorBudgetsUrl(service)}
              {...external}
              variant="body-small"
            >
              Open in Agile Analytics
            </Link>
          ) : null}
        </Flex>
      </CardHeader>
      <CardBody>{content}</CardBody>
    </Card>
  );
};
