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
  DoraOverview,
  DoraOverviewMetric,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { DORA_LABELS, doraBand, overviewValue } from '../../dora';
import { useAgileAnalytics } from '../../hooks';
import { formatDoraValue } from '../DoraTile';
import { KpiTile } from '../KpiTile';

const ORDER: DoraOverviewMetric['id'][] = ['df', 'lt', 'mttr', 'cfr'];

const TREND = {
  '1': { text: 'Improved', tone: 'success' },
  '0': { text: 'Unchanged', tone: 'secondary' },
  '-1': { text: 'Got worse', tone: 'danger' },
} as const;

/** The DORA metrics of the last nightly report, linking to the DORA tab. */
export const DoraSummaryCard = ({ doraHref }: { doraHref: string }) => {
  const report = useAgileAnalytics<DoraOverview | null>('dora/summary');
  if (report.loading) return <Skeleton width="100%" height={140} />;
  if (report.error) {
    return (
      <Alert
        status="warning"
        title="Could not load the DORA metrics"
        description={report.error.message}
      />
    );
  }
  const metrics = report.value?.metrics ?? [];
  if (!metrics.length) return null;

  return (
    <Card>
      <CardHeader>
        <Flex justify="between" align="center">
          <Flex direction="column" gap="1">
            <Text variant="title-small" as="h2">
              DORA metrics
            </Text>
            <Text variant="body-small" color="secondary">
              The last 14 days, against the period before
            </Text>
          </Flex>
          <Link href={doraHref} variant="body-small">
            Details
          </Link>
        </Flex>
      </CardHeader>
      <CardBody>
        <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
          {ORDER.map(id => {
            const metric = metrics.find(m => m.id === id);
            if (!metric) return null;
            const band = doraBand(id, overviewValue(metric));
            const trend = TREND[String(metric.trend) as keyof typeof TREND];
            return (
              <KpiTile
                key={id}
                label={DORA_LABELS[id]}
                value={formatDoraValue(id, overviewValue(metric))}
                tone={band?.tone}
                hint={[
                  band ? `${band.label} performer` : 'No data',
                  trend?.text,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                hintTone={trend?.tone ?? 'secondary'}
              />
            );
          })}
        </Grid.Root>
      </CardBody>
    </Card>
  );
};
