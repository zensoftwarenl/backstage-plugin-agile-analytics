import { useState } from 'react';
import { Card, CardBody, CardHeader, Flex, Link, Text } from '@backstage/ui';
import type {
  HealthAreaId,
  Insight,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { formatDate } from '../../format';
import { AREA_LABELS } from '../../health';
import { useAgileAnalytics } from '../../hooks';
import { insightsUrl } from '../../links';
import { Switch } from '../charts';
import { LoadState } from '../LoadState';
import { SimpleTable } from '../SimpleTable';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

type View = 'open' | 'done' | 'dismissed' | 'all';

const VIEWS: { value: View; label: string; shows: (i: Insight) => boolean }[] =
  [
    {
      value: 'open',
      label: 'Open',
      shows: i => i.status === 'new' || i.status === 'in_progress',
    },
    { value: 'done', label: 'Done', shows: i => i.status === 'done' },
    {
      value: 'dismissed',
      label: 'Dismissed',
      shows: i => i.status === 'dismissed',
    },
    { value: 'all', label: 'All', shows: () => true },
  ];

const STATUS_LABELS: Record<Insight['status'], string> = {
  new: 'New',
  in_progress: 'In progress',
  done: 'Done',
  dismissed: 'Dismissed',
};

/** Must-do first, then the most recently seen. */
export function sortInsights(insights: Insight[]): Insight[] {
  return [...insights].sort(
    (a, b) =>
      (a.priority === 'must' ? 0 : 1) - (b.priority === 'must' ? 0 : 1) ||
      b.last_seen_at.localeCompare(a.last_seen_at),
  );
}

/**
 * The actionable insights to follow up, as the Insights page of Agile
 * Analytics lists them. Their status is changed there.
 */
export const InsightsCard = ({ teamHash }: { teamHash?: string }) => {
  const [view, setView] = useState<View>('open');
  const insights = useAgileAnalytics<Insight[]>('insights');
  const ofScope = (insights.value ?? []).filter(
    i => !teamHash || i.team_hash === teamHash,
  );
  const counts = Object.fromEntries(
    VIEWS.map(v => [v.value, ofScope.filter(v.shows).length]),
  ) as Record<View, number>;
  const shown = sortInsights(
    ofScope.filter(VIEWS.find(v => v.value === view)!.shows),
  );

  return (
    <Card>
      <CardHeader>
        <Flex
          justify="between"
          align="start"
          gap="3"
          style={{ flexWrap: 'wrap' }}
        >
          <Flex direction="column" gap="1">
            <Text variant="title-small" as="h2">
              Insights
            </Text>
            <Text variant="body-small" color="secondary">
              What the health reports advise to follow up
              {teamHash ? ' for this team' : ''}, must-do first.{' '}
              <Link href={insightsUrl()} {...external}>
                Change their status in Agile Analytics
              </Link>
            </Text>
          </Flex>
          <Switch
            label="Which insights"
            options={VIEWS.map(v => ({
              value: v.value,
              label: `${v.label} ${counts[v.value]}`,
            }))}
            value={view}
            onChange={setView}
          />
        </Flex>
      </CardHeader>
      <CardBody>
        <LoadState
          loading={insights.loading}
          error={insights.error}
          what="the insights"
          isEmpty={!shown.length}
          empty={
            ofScope.length
              ? `No ${
                  view === 'all'
                    ? ''
                    : `${VIEWS.find(
                        v => v.value === view,
                      )!.label.toLowerCase()} `
                }insights.`
              : 'No insights yet; they come with the nightly health report.'
          }
        >
          {() => (
            <SimpleTable<Insight>
              label="Insights"
              rows={shown}
              rowKey={i => String(i.id)}
              columns={[
                {
                  key: 'insight',
                  label: 'Insight',
                  render: i => (
                    <Flex direction="column" gap="1" style={{ maxWidth: 560 }}>
                      <Text variant="body-small">
                        {i.text?.en ?? i.text?.nl ?? '–'}
                      </Text>
                      <Text variant="body-x-small" color="secondary">
                        {AREA_LABELS[i.area as HealthAreaId] ?? i.area}
                      </Text>
                    </Flex>
                  ),
                },
                {
                  key: 'priority',
                  label: 'Priority',
                  render: i => (
                    <Text
                      variant="body-small"
                      weight="bold"
                      color={i.priority === 'must' ? 'danger' : 'secondary'}
                    >
                      {i.priority === 'must' ? 'Must' : 'Could'}
                    </Text>
                  ),
                },
                {
                  key: 'seen',
                  label: 'Last seen',
                  render: i => (
                    <Flex direction="column" gap="0">
                      <Text variant="body-small">
                        {formatDate(Date.parse(i.last_seen_at) / 1000)}
                      </Text>
                      {i.in_latest_report === false ? (
                        <Text variant="body-x-small" color="secondary">
                          Not in the latest report
                        </Text>
                      ) : null}
                    </Flex>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: i => STATUS_LABELS[i.status] ?? i.status,
                },
                {
                  key: 'jira',
                  label: 'Jira',
                  render: i =>
                    i.jira_issue?.key ? (
                      <Flex
                        direction="column"
                        gap="0"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {i.jira_issue.url ? (
                          <Link href={i.jira_issue.url} {...external}>
                            {i.jira_issue.key}
                          </Link>
                        ) : (
                          <Text variant="body-small">{i.jira_issue.key}</Text>
                        )}
                        {i.jira_issue.status ? (
                          <Text variant="body-x-small" color="secondary">
                            {i.jira_issue.status}
                          </Text>
                        ) : null}
                      </Flex>
                    ) : (
                      '–'
                    ),
                },
              ]}
            />
          )}
        </LoadState>
      </CardBody>
    </Card>
  );
};
