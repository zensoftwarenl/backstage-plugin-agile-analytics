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
  DoraData,
  FailedDeployment,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { DoraRepository, summariseDora } from '../../dora';
import {
  formatDate,
  formatDuration,
  formatNumber,
  repositoryName,
} from '../../format';
import { useAgileAnalytics } from '../../hooks';
import { areaUrl } from '../../links';
import { scopedPath, useScope } from '../../scope';
import { BarChart } from '../charts';
import { DoraTile } from '../DoraTile';
import { LoadState } from '../LoadState';
import { ScopeBar } from '../ScopeBar';
import { SimpleTable } from '../SimpleTable';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const MAX_FAILURES = 10;

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
