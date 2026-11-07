import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Grid,
  Link,
  Skeleton,
  Text,
} from '@backstage/ui';
import type {
  HealthMetric,
  HealthReport,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import {
  Pillar,
  STATUS,
  areaBasis,
  areaLabel,
  areasNeedingAttention,
  groupByPillar,
  isAvailable,
  isMeasuredInDays,
  scoreTone,
  totalScore,
} from '../../health';
import { areaUrl, overviewUrl } from '../../links';
import { ScoreBar } from '../ScoreBar';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

const AreaRow = ({ metric }: { metric: HealthMetric }) => {
  const available = isAvailable(metric);
  const inDays = isMeasuredInDays(metric);
  const score = Math.round(metric.score ?? 0);
  const trend = Math.round((Number(metric.trend) || 0) * 10) / 10;
  const status =
    metric.status === null || metric.status === undefined
      ? undefined
      : STATUS[String(metric.status) as keyof typeof STATUS];
  const basis = areaBasis(metric);
  const url = areaUrl(metric.id);
  // A rising day count is bad news, a rising score is good news
  const trendGood = inDays ? trend < 0 : trend > 0;

  return (
    <Flex direction="column" gap="1" data-area={metric.id}>
      <Flex justify="between" align="baseline" gap="2">
        {url ? (
          <Link
            href={url}
            {...external}
            variant="body-medium"
            weight="bold"
            truncate
            title={metric.description}
          >
            {areaLabel(metric)}
          </Link>
        ) : (
          <Text
            variant="body-medium"
            weight="bold"
            truncate
            title={metric.description}
          >
            {areaLabel(metric)}
          </Text>
        )}
        <Flex align="baseline" gap="2">
          {available && trend !== 0 ? (
            <Text
              variant="body-x-small"
              color={trendGood ? 'success' : 'danger'}
            >
              {trend > 0 ? '+' : ''}
              {trend}
              {inDays ? ' d' : ' pt'}
            </Text>
          ) : null}
          <Text variant="body-medium" weight="bold">
            {available ? `${score}${inDays ? ' d' : ''}` : '–'}
          </Text>
        </Flex>
      </Flex>
      {available && !inDays ? (
        <ScoreBar score={score} tone={status?.tone ?? scoreTone(score)} />
      ) : null}
      <Flex justify="between" gap="2">
        <Text variant="body-x-small" color="secondary" truncate title={basis}>
          {basis ?? ''}
        </Text>
        <Text
          variant="body-x-small"
          color={available && status ? status.tone : 'secondary'}
        >
          {available && status ? status.label : 'No data'}
        </Text>
      </Flex>
    </Flex>
  );
};

const PillarColumn = ({ pillar }: { pillar: Pillar }) => (
  <Flex direction="column" gap="3" aria-label={`${pillar.name} areas`}>
    <Flex justify="between" align="center">
      <Text variant="title-x-small" as="h3" title={pillar.description}>
        {pillar.name}
      </Text>
      <Text
        weight="bold"
        color={pillar.score === null ? 'secondary' : scoreTone(pillar.score)}
      >
        {pillar.score ?? '–'}
      </Text>
    </Flex>
    {pillar.metrics.length ? (
      pillar.metrics.map(metric => <AreaRow key={metric.id} metric={metric} />)
    ) : (
      <Text variant="body-small" color="secondary">
        No areas measured
      </Text>
    )}
  </Flex>
);

type HealthCardProps = {
  report?: HealthReport;
  /** The team the report is for; the whole organisation when missing. */
  teamHash?: string;
  loading: boolean;
  error?: Error;
};

export const HealthCard = ({
  report,
  teamHash,
  loading,
  error,
}: HealthCardProps) => {
  if (loading) {
    return <Skeleton width="100%" height={320} />;
  }
  if (error) {
    return (
      <Alert
        status="danger"
        title="Could not load the health report"
        description={error.message}
      />
    );
  }

  const metrics = report?.metrics ?? [];
  const pillars = groupByPillar(metrics);
  const total = totalScore(pillars);
  const attention = areasNeedingAttention(metrics);

  return (
    <Card>
      <CardHeader>
        <Flex justify="between" align="center">
          <Flex direction="column" gap="1">
            <Link
              href={overviewUrl(teamHash)}
              {...external}
              variant="title-small"
            >
              Engineering health
            </Link>
            <Text variant="body-small" color="secondary">
              The average of DevEx, OpsEx and AgileEx, each the average of its
              areas that have data.
            </Text>
          </Flex>
          <Flex direction="column" align="end" gap="1">
            <Text
              variant="title-large"
              weight="bold"
              color={total === null ? 'secondary' : scoreTone(total)}
              aria-label={
                total === null
                  ? 'No health score yet'
                  : `Engineering health score ${total} out of 100`
              }
            >
              {total ?? '–'}
            </Text>
            {attention.total ? (
              <Text variant="body-small" color="secondary">
                {attention.count
                  ? `${attention.count} of ${attention.total} areas need attention`
                  : 'All areas on track'}
              </Text>
            ) : null}
          </Flex>
        </Flex>
      </CardHeader>
      <CardBody>
        {metrics.length ? (
          <Grid.Root columns={{ initial: '1', md: '3' }} gap="6">
            {pillars.map(pillar => (
              <PillarColumn key={pillar.id} pillar={pillar} />
            ))}
          </Grid.Root>
        ) : (
          <Text color="secondary">
            No health report yet. Agile Analytics writes one every night once
            your integrations are connected.
          </Text>
        )}
      </CardBody>
    </Card>
  );
};
