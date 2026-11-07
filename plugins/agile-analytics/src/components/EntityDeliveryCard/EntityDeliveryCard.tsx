import { useEntity } from '@backstage/plugin-catalog-react';
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
  AiAdoption,
  Collaboration,
  DoraData,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { adoptionTone } from '../../ai';
import { STATUS_BY_ID, describeOwners } from '../../collaboration';
import {
  AGILE_ANALYTICS_REPOSITORY_ANNOTATION,
  agileAnalyticsRepository,
} from '../../entity';
import { formatShare } from '../../format';
import { useAgileAnalytics } from '../../hooks';
import { areaUrl } from '../../links';
import { repositoryInsights } from '../../repository';
import { DoraTile } from '../DoraTile';
import { KpiTile } from '../KpiTile';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const DAYS = 30;

/**
 * How the repository an entity is linked to is delivered: its DORA metrics,
 * who knows it and how much of its work AI helped with.
 */
export const EntityDeliveryCard = () => {
  const { entity } = useEntity();
  const repository = agileAnalyticsRepository(entity);
  const dora = useAgileAnalytics<DoraData>(
    repository ? `dora?days=${DAYS}` : undefined,
  );
  const collaboration = useAgileAnalytics<Collaboration | null>(
    repository ? 'collaboration' : undefined,
  );
  const adoption = useAgileAnalytics<AiAdoption | null>(
    repository ? `ai/adoption?days=${DAYS}` : undefined,
  );
  const loading = dora.loading || collaboration.loading || adoption.loading;
  const insights = repository
    ? repositoryInsights(repository, {
        dora: dora.value,
        collaboration: collaboration.value,
        adoption: adoption.value,
      })
    : {};
  const errors = [dora.error, collaboration.error, adoption.error].filter(
    Boolean,
  );

  let content;
  if (!repository) {
    content = (
      <Text color="secondary">
        Add the <code>{AGILE_ANALYTICS_REPOSITORY_ANNOTATION}</code> annotation,
        or a GitHub or GitLab project slug, to show how this repository is
        delivered.
      </Text>
    );
  } else if (loading) {
    content = <Skeleton width="100%" height={160} />;
  } else if (
    errors.length &&
    !insights.dora &&
    !insights.knowledge &&
    !insights.ai
  ) {
    content = (
      <Alert
        status="danger"
        title="Could not load Agile Analytics"
        description={errors[0]!.message}
      />
    );
  } else if (!insights.dora && !insights.knowledge && !insights.ai) {
    content = (
      <Text color="secondary">
        Agile Analytics has no deployments, merge requests or contributors for{' '}
        <code>{repository}</code> yet. Check that the repository is connected in
        Agile Analytics.
      </Text>
    );
  } else {
    const { dora: summary, knowledge, ai } = insights;
    const status = knowledge ? STATUS_BY_ID[knowledge.status] : undefined;
    content = (
      <Flex direction="column" gap="4">
        {summary ? (
          <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
            <DoraTile id="df" value={summary.deploymentFrequency} />
            <DoraTile id="lt" value={summary.leadTime} />
            <DoraTile id="mttr" value={summary.timeToRestore} />
            <DoraTile id="cfr" value={summary.changeFailureRate} />
          </Grid.Root>
        ) : (
          <Text variant="body-small" color="secondary">
            No production deployments in the last {DAYS} days.
          </Text>
        )}
        <Grid.Root columns={{ initial: '1', md: '2' }} gap="3">
          <KpiTile
            label="Who knows it"
            value={status?.label ?? 'Unknown'}
            tone={status?.tone}
            hint={
              knowledge
                ? [
                    `Bus factor ${knowledge.bus_factor}`,
                    describeOwners(knowledge.owners),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : 'No contributors in the last year'
            }
          />
          <KpiTile
            label="AI assisted merge requests"
            value={formatShare(ai?.share)}
            tone={adoptionTone(ai?.share)}
            hint={
              ai
                ? `${ai.aiAssisted} of ${ai.attributed} attributed, ${ai.merged} merged`
                : `Nothing merged in the last ${DAYS} days`
            }
          />
        </Grid.Root>
      </Flex>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Flex justify="between" align="center">
          <Flex direction="column" gap="1">
            <Text variant="title-small" as="h2">
              Delivery
            </Text>
            <Text variant="body-small" color="secondary">
              From Agile Analytics, the last {DAYS} days
            </Text>
          </Flex>
          <Link href={areaUrl('delivery')!} variant="body-small" {...external}>
            Open in Agile Analytics
          </Link>
        </Flex>
      </CardHeader>
      <CardBody>{content}</CardBody>
    </Card>
  );
};
