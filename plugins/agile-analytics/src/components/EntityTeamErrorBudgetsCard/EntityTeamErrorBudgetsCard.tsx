import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { ResponseError } from '@backstage/errors';
import { useApi } from '@backstage/frontend-plugin-api';
import {
  catalogApiRef,
  EntityRefLink,
  useEntity,
} from '@backstage/plugin-catalog-react';
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
import useAsync from 'react-use/esm/useAsync';
import { AGILE_ANALYTICS_SERVICE_ANNOTATION } from '../../entity';
import { useAgileAnalytics } from '../../hooks';
import { errorBudgetSettingsUrl, errorBudgetsUrl } from '../../links';
import { summariseSlos } from '../../slos';
import { servicesOwnedBy, type TeamService, teamServices } from '../../team';
import { SloRow } from '../SloRow';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** One service of the team, with the error budgets of its SLOs. */
const ServiceBudgets = ({
  item,
  groupRef,
}: {
  item: TeamService;
  groupRef: string;
}) => {
  const { entity, service, summary } = item;
  const owner = String(entity.spec?.owner ?? '');
  // Name the team when the service belongs to one below this group
  const ownerRef = owner
    ? stringifyEntityRef(parseEntityRef(owner, { defaultKind: 'group' }))
    : undefined;
  const byOtherTeam = ownerRef && ownerRef.toLowerCase() !== groupRef;

  let status;
  if (summary.total) {
    status = (
      <Text
        variant="body-small"
        color={summary.overBudget ? 'danger' : 'success'}
      >
        {summary.overBudget
          ? `${summary.overBudget} of ${summary.total} over budget`
          : `${summary.onTarget} of ${summary.total} on target`}
      </Text>
    );
  } else {
    status = (
      <Text variant="body-small" color="secondary">
        {service ? 'No SLOs yet' : 'Not linked'}
      </Text>
    );
  }

  return (
    <Flex direction="column" gap="3" data-service={entity.metadata.name}>
      <Flex justify="between" align="baseline" gap="2">
        <Flex align="baseline" gap="2">
          <Text variant="body-large" weight="bold">
            <EntityRefLink entityRef={entity} />
          </Text>
          {byOtherTeam ? (
            <Text variant="body-x-small" color="secondary">
              <EntityRefLink entityRef={ownerRef} defaultKind="group" />
            </Text>
          ) : null}
          {service ? (
            <Link
              href={errorBudgetsUrl(service)}
              {...external}
              variant="body-x-small"
              color="secondary"
            >
              {service}
            </Link>
          ) : null}
        </Flex>
        {status}
      </Flex>
      {summary.lowest.map(slo => (
        <SloRow key={slo.id} slo={slo} showService={false} />
      ))}
    </Flex>
  );
};

/**
 * The services a group and its teams own, with the SLOs and error budgets of
 * the Agile Analytics service each is linked to.
 */
export const EntityTeamErrorBudgetsCard = () => {
  const { entity } = useEntity();
  const catalogApi = useApi(catalogApiRef);
  const groupRef = stringifyEntityRef(entity).toLowerCase();
  const owned = useAsync(
    () => servicesOwnedBy(catalogApi, entity),
    [catalogApi, groupRef],
  );
  const linked = owned.value?.some(e =>
    Boolean(e.metadata.annotations?.[AGILE_ANALYTICS_SERVICE_ANNOTATION]),
  );
  const report = useAgileAnalytics<SloReport>(linked ? 'slos' : undefined);
  const services = teamServices(owned.value ?? [], report.value?.metrics);
  const withSlos = services.filter(s => s.summary.total);
  const withoutSlos = services.filter(s => !s.summary.total);
  const overall = summariseSlos(withSlos.flatMap(s => s.summary.lowest));
  // Agile Analytics answers 404 until it has made a first SLO report
  const noReport =
    report.error instanceof ResponseError && report.error.statusCode === 404;

  let content;
  if (owned.loading || report.loading) {
    content = <Skeleton width="100%" height={160} />;
  } else if (owned.error) {
    content = (
      <Alert
        status="danger"
        title="Could not load the services of this group"
        description={owned.error.message}
      />
    );
  } else if (!services.length) {
    content = (
      <Text color="secondary">
        This group owns no services. Components of type <code>service</code> or{' '}
        <code>website</code> show up here.
      </Text>
    );
  } else {
    content = (
      <Flex direction="column" gap="5">
        {report.error && !noReport ? (
          <Alert
            status="danger"
            title="Could not load the error budgets"
            description={report.error.message}
          />
        ) : null}
        {withSlos.map(item => (
          <ServiceBudgets
            key={stringifyEntityRef(item.entity)}
            item={item}
            groupRef={groupRef}
          />
        ))}
        {withoutSlos.length ? (
          <Flex direction="column" gap="2">
            <Text variant="body-medium" weight="bold">
              Without SLOs
            </Text>
            {withoutSlos.map(item => (
              <ServiceBudgets
                key={stringifyEntityRef(item.entity)}
                item={item}
                groupRef={groupRef}
              />
            ))}
            <Text variant="body-x-small" color="secondary">
              Link a service with the{' '}
              <code>{AGILE_ANALYTICS_SERVICE_ANNOTATION}</code> annotation and{' '}
              <Link href={errorBudgetSettingsUrl()} {...external}>
                set up its SLOs in Agile Analytics
              </Link>
              .
            </Text>
          </Flex>
        ) : null}
      </Flex>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Flex justify="between" align="center" gap="2">
          <Flex direction="column" gap="1">
            <Text variant="title-x-small" as="h2">
              Services and error budgets
            </Text>
            {overall.total ? (
              <Text
                variant="body-small"
                color={overall.overBudget ? 'danger' : 'success'}
              >
                {overall.overBudget
                  ? `${overall.overBudget} of ${overall.total} SLOs over budget`
                  : `${overall.onTarget} of ${overall.total} SLOs on target`}
              </Text>
            ) : null}
          </Flex>
          <Link href={errorBudgetsUrl()} {...external} variant="body-small">
            Open in Agile Analytics
          </Link>
        </Flex>
      </CardHeader>
      <CardBody>{content}</CardBody>
    </Card>
  );
};
