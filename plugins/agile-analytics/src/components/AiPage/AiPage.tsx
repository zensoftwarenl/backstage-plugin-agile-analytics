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
  AiAdoption,
  AiCostAndReturn,
  AiDelivery,
  AiQuality,
  AiVerdict,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import {
  AI_ADOPTION_TARGET,
  AiRepository,
  adoptionTone,
  aiRepositories,
  aiTools,
  describeVerdict,
  recentAiMergeRequests,
} from '../../ai';
import {
  formatDate,
  formatDuration,
  formatMoney,
  formatNumber,
  formatShare,
  repositoryName,
} from '../../format';
import { useAgileAnalytics } from '../../hooks';
import { areaUrl } from '../../links';
import { scopedPath, useScope } from '../../scope';
import { CompareBars } from '../charts';
import { KpiTile } from '../KpiTile';
import { LoadState } from '../LoadState';
import { ScopeBar } from '../ScopeBar';
import { SimpleTable } from '../SimpleTable';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const MAX_REPOSITORIES = 15;
const MAX_RECENT = 8;

const VERDICTS: { key: keyof AiDelivery['metrics']; label: string }[] = [
  { key: 'time_to_first_approval', label: 'Time to first approval' },
  { key: 'time_to_merge', label: 'Time to merge' },
  { key: 'time_to_deploy', label: 'Time to deploy' },
];

const VerdictRow = ({
  label,
  verdict,
}: {
  label: string;
  verdict: AiVerdict | undefined;
}) => {
  const { text, tone } = describeVerdict(verdict);
  return (
    <Flex direction="column" gap="1" data-verdict={label}>
      <Flex justify="between" align="baseline">
        <Text weight="bold">{label}</Text>
        <Text variant="body-small" color={tone}>
          {text}
        </Text>
      </Flex>
      <CompareBars
        format={value => formatDuration(value)}
        rows={[
          {
            label: 'With AI',
            value: verdict?.ai_typical ?? null,
            tone: 'info',
          },
          {
            label: 'Without',
            value: verdict?.other_typical ?? null,
            tone: 'warning',
          },
        ]}
      />
      <Text variant="body-x-small" color="secondary">
        Typical of {verdict?.ai_count ?? 0} with and {verdict?.other_count ?? 0}{' '}
        without AI, across {verdict?.repositories ?? 0} repositories
      </Text>
    </Flex>
  );
};

const AdoptionSection = ({ adoption }: { adoption: AiAdoption }) => {
  const tools = aiTools(adoption);
  const repositories = aiRepositories(adoption.merge_requests).slice(
    0,
    MAX_REPOSITORIES,
  );
  const recent = recentAiMergeRequests(adoption.merge_requests, MAX_RECENT);
  const rate = adoption.adoption_rate;

  return (
    <>
      <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
        <KpiTile
          label="AI adoption"
          value={formatShare(rate)}
          tone={adoptionTone(rate)}
          hint={`Target ${formatShare(AI_ADOPTION_TARGET)} of attributed work`}
          title="Share of merged work with a known AI signal that AI helped with"
        />
        <KpiTile
          label="AI assisted merges"
          value={formatNumber(adoption.ai_assisted)}
          hint={`of ${formatNumber(adoption.total)} merged`}
        />
        <KpiTile
          label="Coverage"
          value={formatShare(adoption.coverage)}
          hint={`${formatNumber(
            adoption.unattributed,
          )} merges without an AI signal`}
          title="Share of merged work that says whether AI helped"
        />
        <KpiTile
          label="Commit adoption"
          value={formatShare(adoption.commits?.adoption_rate)}
          hint={`${formatNumber(
            adoption.commits?.ai_assisted,
          )} of ${formatNumber(adoption.commits?.total)} commits`}
        />
      </Grid.Root>

      <Grid.Root columns={{ initial: '1', md: '3' }} gap="4">
        <Grid.Item colSpan={{ initial: '1', md: '2' }}>
          <Card>
            <CardHeader>
              <Text variant="title-small" as="h2">
                Repositories
              </Text>
              <Text variant="body-small" color="secondary">
                Most merged work first
              </Text>
            </CardHeader>
            <CardBody>
              <SimpleTable<AiRepository>
                label="AI adoption per repository"
                rows={repositories}
                rowKey={r => r.repository}
                columns={[
                  {
                    key: 'repository',
                    label: 'Repository',
                    render: r => r.repository,
                  },
                  {
                    key: 'merged',
                    label: 'Merged',
                    align: 'right',
                    render: r => r.merged,
                  },
                  {
                    key: 'ai',
                    label: 'With AI',
                    align: 'right',
                    render: r => r.aiAssisted,
                  },
                  {
                    key: 'share',
                    label: 'Adoption',
                    align: 'right',
                    render: r => (
                      <Text
                        variant="body-small"
                        color={adoptionTone(r.share) ?? 'secondary'}
                      >
                        {formatShare(r.share)}
                      </Text>
                    ),
                  },
                ]}
              />
            </CardBody>
          </Card>
        </Grid.Item>
        <Card>
          <CardHeader>
            <Text variant="title-small" as="h2">
              Tools
            </Text>
          </CardHeader>
          <CardBody>
            {tools.length ? (
              <Flex direction="column" gap="2">
                {tools.map(tool => (
                  <Flex key={tool.tool} justify="between" gap="2">
                    <Text weight="bold" truncate>
                      {tool.tool}
                    </Text>
                    <Text variant="body-small" color="secondary">
                      {tool.mergeRequests} merges · {tool.commits} commits
                    </Text>
                  </Flex>
                ))}
              </Flex>
            ) : (
              <Text color="secondary">No AI tools named yet.</Text>
            )}
          </CardBody>
        </Card>
      </Grid.Root>

      <Card>
        <CardHeader>
          <Text variant="title-small" as="h2">
            Recent AI assisted work
          </Text>
        </CardHeader>
        <CardBody>
          {recent.length ? (
            <Flex direction="column" gap="2">
              {recent.map(mr => (
                <Flex
                  key={`${mr.repository}-${mr.iid}-${mr.merged_date}`}
                  justify="between"
                  gap="3"
                >
                  <Flex direction="column" gap="0" style={{ minWidth: 0 }}>
                    <Text truncate>{mr.title || `!${mr.iid}`}</Text>
                    <Text variant="body-x-small" color="secondary">
                      {repositoryName(mr.repository)}
                      {mr.author ? ` · ${mr.author}` : ''}
                    </Text>
                  </Flex>
                  <Text
                    variant="body-x-small"
                    color="secondary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {mr.ai_tool ?? 'AI'} · {formatDate(mr.merged_date)}
                  </Text>
                </Flex>
              ))}
            </Flex>
          ) : (
            <Text color="secondary">No AI assisted merges in this period.</Text>
          )}
        </CardBody>
      </Card>
    </>
  );
};

const ImpactSection = ({
  delivery,
  quality,
}: {
  delivery?: AiDelivery | null;
  quality?: AiQuality | null;
}) => {
  const high = quality?.cohorts?.high_ai;
  const low = quality?.cohorts?.low_ai;
  const rework = quality?.rework;
  return (
    <Grid.Root columns={{ initial: '1', md: '2' }} gap="4">
      <Card>
        <CardHeader>
          <Text variant="title-small" as="h2">
            Speed
          </Text>
          <Text variant="body-small" color="secondary">
            AI assisted work against other work in the same repositories
          </Text>
        </CardHeader>
        <CardBody>
          <Flex direction="column" gap="4">
            {VERDICTS.map(({ key, label }) => (
              <VerdictRow
                key={key}
                label={label}
                verdict={delivery?.metrics?.[key]}
              />
            ))}
          </Flex>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <Text variant="title-small" as="h2">
            Quality
          </Text>
          <Text variant="body-small" color="secondary">
            Repositories where at least {formatShare(quality?.threshold ?? 0.5)}{' '}
            of the work is AI assisted against the rest
          </Text>
        </CardHeader>
        <CardBody>
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Text weight="bold">Change failure rate</Text>
              <CompareBars
                format={formatShare}
                rows={[
                  {
                    label: 'High AI',
                    value: high?.change_failure_rate ?? null,
                    tone: 'info',
                  },
                  {
                    label: 'Low AI',
                    value: low?.change_failure_rate ?? null,
                    tone: 'warning',
                  },
                ]}
              />
              <Text variant="body-x-small" color="secondary">
                {high?.failed_deployments ?? 0} of {high?.deployments ?? 0}{' '}
                deployments failed in {high?.repositories ?? 0} high AI
                repositories, {low?.failed_deployments ?? 0} of{' '}
                {low?.deployments ?? 0} in {low?.repositories ?? 0} others
              </Text>
            </Flex>
            {rework ? (
              <Flex direction="column" gap="1">
                <Text weight="bold">Rework</Text>
                <CompareBars
                  format={formatShare}
                  rows={[
                    {
                      label: 'With AI',
                      value: rework.cohorts.ai?.enough
                        ? rework.cohorts.ai.rework_rate
                        : null,
                      tone: 'info',
                    },
                    {
                      label: 'Without',
                      value: rework.cohorts.other?.enough
                        ? rework.cohorts.other.rework_rate
                        : null,
                      tone: 'warning',
                    },
                  ]}
                />
                <Text variant="body-x-small" color="secondary">
                  Merged work that was reverted or fixed within{' '}
                  {rework.window_days} days
                </Text>
              </Flex>
            ) : null}
          </Flex>
        </CardBody>
      </Card>
    </Grid.Root>
  );
};

function netTone(net: number | null | undefined) {
  if (net === null || net === undefined) return undefined;
  return net >= 0 ? 'success' : 'danger';
}

const CostSection = ({ costs }: { costs: AiCostAndReturn }) => {
  const { cost, return: value } = costs;
  if (!cost?.configured) {
    return (
      <Card>
        <CardBody>
          <Text color="secondary">
            Add your AI tool spend in{' '}
            <Link href={areaUrl('ai')!} {...external}>
              Agile Analytics
            </Link>{' '}
            to see the cost per AI assisted merge and the return.
          </Text>
        </CardBody>
      </Card>
    );
  }
  const currency = cost.currency;
  return (
    <Flex direction="column" gap="2">
      <Text variant="title-small" as="h2">
        Cost and return
      </Text>
      <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
        <KpiTile label="AI spend" value={formatMoney(cost.spend, currency)} />
        <KpiTile
          label="Cost per AI merge"
          value={formatMoney(cost.cost_per_ai_merge_request, currency)}
          hint={`${formatNumber(cost.ai_merge_requests)} AI assisted merges`}
        />
        <KpiTile
          label="Hours saved"
          value={
            value?.hours_saved === null || value?.hours_saved === undefined
              ? '–'
              : `${formatNumber(value.hours_saved)} h`
          }
          hint={
            value?.measurement?.reliable
              ? `From ${value.measurement.people_compared} people compared`
              : 'Not enough data to measure yet'
          }
        />
        <KpiTile
          label="Net return"
          value={formatMoney(value?.net, currency)}
          tone={netTone(value?.net)}
          hint={
            value?.return_ratio
              ? `${formatNumber(value.return_ratio, 1)}× the spend`
              : undefined
          }
        />
      </Grid.Root>
    </Flex>
  );
};

/** How much AI helps with the work, and what it does to speed, quality and cost. */
export const AiPage = () => {
  const { days } = useScope();
  const adoption = useAgileAnalytics<AiAdoption | null>(
    scopedPath('ai/adoption', { days }),
  );
  const delivery = useAgileAnalytics<AiDelivery | null>(
    scopedPath('ai/delivery', { days }),
  );
  const quality = useAgileAnalytics<AiQuality | null>(
    scopedPath('ai/quality', { days }),
  );
  const costs = useAgileAnalytics<AiCostAndReturn>(
    scopedPath('ai/cost', { days }),
  );

  return (
    <Container>
      <Flex direction="column" gap="4" py="4">
        <ScopeBar
          teams={false}
          note="Agile Analytics measures AI impact for the whole organisation."
        />
        <LoadState
          loading={adoption.loading}
          error={adoption.error}
          what="the AI adoption"
          height={360}
          isEmpty={!adoption.value}
          empty={
            <>
              No merged work in the last {days} days.{' '}
              <Link href={areaUrl('ai')!} {...external}>
                See how Agile Analytics recognises AI assisted work
              </Link>
              .
            </>
          }
        >
          {() => <AdoptionSection adoption={adoption.value!} />}
        </LoadState>
        <LoadState
          loading={delivery.loading || quality.loading}
          error={delivery.error ?? quality.error}
          what="the AI impact"
        >
          {() => (
            <ImpactSection delivery={delivery.value} quality={quality.value} />
          )}
        </LoadState>
        <LoadState
          loading={costs.loading}
          error={costs.error}
          what="the AI cost"
          height={100}
        >
          {() => <CostSection costs={costs.value!} />}
        </LoadState>
      </Flex>
    </Container>
  );
};
