import { useState } from 'react';
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
  HealthPillarId,
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
import { HealthRing, PILLAR_COLORS } from '../HealthRing';
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

const PillarColumn = ({
  pillar,
  faded,
}: {
  pillar: Pillar;
  /** Another third is picked on the ring. */
  faded: boolean;
}) => (
  <Flex
    direction="column"
    gap="3"
    aria-label={`${pillar.name} areas`}
    data-pillar={pillar.id}
    style={{ opacity: faded ? 0.45 : 1, transition: 'opacity 200ms' }}
  >
    <Flex justify="between" align="center">
      <Flex align="center" gap="2">
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: PILLAR_COLORS[pillar.id],
          }}
        />
        <Text variant="title-x-small" as="h3" title={pillar.description}>
          {pillar.name}
        </Text>
      </Flex>
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
  const [active, setActive] = useState<HealthPillarId | null>(null);
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
          {attention.total ? (
            <Text variant="body-small" color="secondary">
              {attention.count
                ? `${attention.count} of ${attention.total} areas need attention`
                : 'All areas on track'}
            </Text>
          ) : null}
        </Flex>
      </CardHeader>
      <CardBody>
        {metrics.length ? (
          <Flex direction="column" gap="6">
            <HealthRing
              total={total}
              pillars={pillars}
              active={active}
              onSelect={setActive}
            />
            <Grid.Root columns={{ initial: '1', md: '3' }} gap="6">
              {pillars.map(pillar => (
                <PillarColumn
                  key={pillar.id}
                  pillar={pillar}
                  faded={!!active && active !== pillar.id}
                />
              ))}
            </Grid.Root>
          </Flex>
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
