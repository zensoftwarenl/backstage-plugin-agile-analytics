import {
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Grid,
  Select,
  Text,
} from '@backstage/ui';
import {
  TREND_DAYS,
  TrendBucket,
  Trends,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { useSearchParams } from 'react-router-dom';
import { adoptionTone } from '../../ai';
import { DORA_LABELS, doraBand } from '../../dora';
import { formatDate, formatShare } from '../../format';
import { useAgileAnalytics } from '../../hooks';
import type { Tone } from '../../health';
import { COMPARE_BUCKETS, compareRecent, describeChange } from '../../trends';
import { BarChart, Sparkline } from '../charts';
import { formatDoraValue } from '../DoraTile';
import { KpiTile } from '../KpiTile';
import { LoadState } from '../LoadState';

const ORGANISATION = 'org';
const DEFAULT_RANGE = TREND_DAYS[0];

/** The period and repository, kept in the URL like the team and period. */
function useTrendScope() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = Number(searchParams.get('range'));
  const days = (TREND_DAYS as readonly number[]).includes(requested)
    ? requested
    : DEFAULT_RANGE;
  const repository = searchParams.get('repository') || undefined;
  const update = (key: string, value: string | undefined) =>
    setSearchParams(
      previous => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  return {
    days,
    repository,
    setDays: (value: number) =>
      update('range', value === DEFAULT_RANGE ? undefined : String(value)),
    setRepository: (value: string | undefined) => update('repository', value),
  };
}

function trendsPath(days: number, repository?: string) {
  const query = new URLSearchParams({ days: String(days) });
  if (repository) query.set('node', repository);
  return `trends?${query}`;
}

const LineCard = ({
  title,
  description,
  buckets,
  value,
  format,
  tone,
}: {
  title: string;
  description: string;
  buckets: TrendBucket[];
  value: (bucket: TrendBucket) => number | null;
  format: (value: number | null) => string;
  tone: Tone | 'info';
}) => {
  // The bucket in progress would make the latest value jump about
  const points = buckets
    .filter(b => !b.partial)
    .map(b => ({ start: b.start, value: value(b) }))
    .filter((p): p is { start: number; value: number } => p.value !== null);
  const latest = points[points.length - 1];
  return (
    <Card>
      <CardHeader>
        <Flex justify="between" align="baseline" gap="2">
          <Text variant="title-small" as="h2">
            {title}
          </Text>
          <Text variant="body-small" weight="bold">
            {latest ? format(latest.value) : '–'}
          </Text>
        </Flex>
        <Text variant="body-small" color="secondary">
          {description}
        </Text>
      </CardHeader>
      <CardBody>
        {points.length >= 2 ? (
          <Flex direction="column" gap="1">
            <Sparkline
              values={points.map(p => p.value)}
              tone={tone}
              height={80}
              title={`${title}: ${points
                .map(p => `${formatDate(p.start)} ${format(p.value)}`)
                .join(', ')}`}
            />
            <Flex justify="between">
              <Text variant="body-x-small" color="secondary">
                {formatDate(points[0].start)}
              </Text>
              <Text variant="body-x-small" color="secondary">
                {formatDate(latest.start)}
              </Text>
            </Flex>
          </Flex>
        ) : (
          <Text color="secondary">Not enough data for a trend yet.</Text>
        )}
      </CardBody>
    </Card>
  );
};

/** DORA and AI adoption per week, for the organisation or one repository. */
export const TrendsPage = () => {
  const { days, repository, setDays, setRepository } = useTrendScope();
  // The organisation's trends also list the repositories to pick from
  const organisation = useAgileAnalytics<Trends | null>(trendsPath(days));
  const scoped = useAgileAnalytics<Trends | null>(
    repository ? trendsPath(days, repository) : undefined,
  );
  const data = repository ? scoped : organisation;
  const buckets = data.value?.buckets ?? [];
  const { recent, previous } = compareRecent(buckets);
  const unit = data.value?.bucket === 'day' ? 'day' : 'week';
  const repositories = [...(organisation.value?.repositories ?? [])].sort();

  return (
    <Container>
      <Flex direction="column" gap="4" py="4">
        <Flex
          justify="between"
          align="end"
          gap="3"
          style={{ flexWrap: 'wrap' }}
        >
          <Flex align="end" gap="3" style={{ flexWrap: 'wrap' }}>
            <Select
              label="Repository"
              size="small"
              search={{ placeholder: 'Find a repository' }}
              options={[
                { value: ORGANISATION, label: 'All repositories' },
                ...repositories.map(r => ({ value: r, label: r })),
                // Linked to before the list has loaded, or no longer in it
                ...(repository && !repositories.includes(repository)
                  ? [{ value: repository, label: repository }]
                  : []),
              ]}
              selectedKey={repository ?? ORGANISATION}
              onSelectionChange={key =>
                key &&
                setRepository(
                  String(key) === ORGANISATION ? undefined : String(key),
                )
              }
            />
            <Select
              label="Period"
              size="small"
              options={TREND_DAYS.map(d => ({
                value: String(d),
                label: `Last ${Math.round(d / 7)} weeks`,
              }))}
              selectedKey={String(days)}
              onSelectionChange={key => key && setDays(Number(key))}
            />
          </Flex>
          <Text variant="body-x-small" color="secondary">
            Agile Analytics does not split these per team; pick a repository
            instead.
          </Text>
        </Flex>
        <LoadState
          loading={data.loading}
          error={data.error}
          what="the trends"
          height={420}
          isEmpty={!buckets.some(b => b.deployments || b.merged)}
          empty={<>No deployments or merged work in this period.</>}
        >
          {() => {
            const df = describeChange(
              recent?.deploymentFrequency,
              previous?.deploymentFrequency,
              true,
            );
            const lt = describeChange(
              recent?.leadTime,
              previous?.leadTime,
              false,
            );
            const cfr = describeChange(
              recent?.changeFailureRate,
              previous?.changeFailureRate,
              false,
            );
            const ai = describeChange(recent?.aiShare, previous?.aiShare, true);
            const cfrPercent =
              recent?.changeFailureRate === null ||
              recent?.changeFailureRate === undefined
                ? null
                : recent.changeFailureRate * 100;
            return (
              <>
                <Text variant="body-small" color="secondary">
                  The last {COMPARE_BUCKETS} complete {unit}s against the{' '}
                  {COMPARE_BUCKETS} before.
                </Text>
                <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
                  <KpiTile
                    label={DORA_LABELS.df}
                    value={formatDoraValue(
                      'df',
                      recent?.deploymentFrequency ?? null,
                    )}
                    tone={doraBand('df', recent?.deploymentFrequency)?.tone}
                    hint={df?.text ?? 'Nothing to compare with'}
                    hintTone={df?.tone}
                  />
                  <KpiTile
                    label={DORA_LABELS.lt}
                    value={formatDoraValue('lt', recent?.leadTime ?? null)}
                    tone={doraBand('lt', recent?.leadTime)?.tone}
                    hint={lt?.text ?? 'Nothing to compare with'}
                    hintTone={lt?.tone}
                  />
                  <KpiTile
                    label={DORA_LABELS.cfr}
                    value={formatDoraValue('cfr', cfrPercent)}
                    tone={doraBand('cfr', cfrPercent)?.tone}
                    hint={cfr?.text ?? 'Nothing to compare with'}
                    hintTone={cfr?.tone}
                  />
                  <KpiTile
                    label="AI assisted merged work"
                    value={formatShare(recent?.aiShare)}
                    tone={adoptionTone(recent?.aiShare)}
                    hint={ai?.text ?? 'Nothing to compare with'}
                    hintTone={ai?.tone}
                  />
                </Grid.Root>

                <Card>
                  <CardHeader>
                    <Text variant="title-small" as="h2">
                      Production deployments per {unit}
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <BarChart
                      title={`Production deployments per ${unit}`}
                      bars={buckets.map(b => ({
                        label: formatDate(b.start),
                        values: [
                          Math.max(0, b.deployments - b.failed_deployments),
                          b.failed_deployments,
                        ],
                      }))}
                      series={[
                        { label: 'Deployed', tone: 'success' },
                        { label: 'Needed a fix', tone: 'danger' },
                      ]}
                    />
                  </CardBody>
                </Card>

                <Grid.Root columns={{ initial: '1', md: '3' }} gap="4">
                  <LineCard
                    title={DORA_LABELS.lt}
                    description={`Median from merge to production per ${unit}`}
                    buckets={buckets}
                    value={b => b.lead_time_for_changes}
                    format={v => formatDoraValue('lt', v)}
                    tone="info"
                  />
                  <LineCard
                    title={DORA_LABELS.cfr}
                    description={`Share of production deployments that needed a fix per ${unit}`}
                    buckets={buckets}
                    value={b => b.change_failure_rate}
                    format={formatShare}
                    tone="danger"
                  />
                  <LineCard
                    title="AI assisted merged work"
                    description={`Share of attributed merged work per ${unit}`}
                    buckets={buckets}
                    value={b => b.ai_share}
                    format={formatShare}
                    tone="success"
                  />
                </Grid.Root>
              </>
            );
          }}
        </LoadState>
      </Flex>
    </Container>
  );
};
