import {
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Grid,
  Link,
  Select,
  Text,
} from '@backstage/ui';
import {
  COLLABORATION_WINDOWS,
  Collaboration,
  ReviewMetrics,
  ReviewSummary,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { useSearchParams } from 'react-router-dom';
import {
  STATUSES,
  STATUS_BY_ID,
  describeOwners,
  summariseCollaboration,
} from '../../collaboration';
import {
  formatHours,
  formatNumber,
  formatShare,
  repositoryName,
} from '../../format';
import { useAgileAnalytics } from '../../hooks';
import { areaUrl } from '../../links';
import { scopedPath, useScope } from '../../scope';
import { KpiTile } from '../KpiTile';
import { LoadState } from '../LoadState';
import { OwnershipGraph } from '../OwnershipGraph';
import { ScopeBar } from '../ScopeBar';
import { SimpleTable } from '../SimpleTable';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const DEFAULT_WINDOW = 730;
const MAX_ATTENTION = 15;
const MAX_REVIEW_REPOSITORIES = 10;

type RepositoryRow = Collaboration['repositories'][number];
type TeamRow = Collaboration['teams'][number];
type ReviewRow = ReviewMetrics & { repository: string };

function useWindowDays() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = Number(searchParams.get('window'));
  const windowDays = (COLLABORATION_WINDOWS as readonly number[]).includes(
    requested,
  )
    ? requested
    : DEFAULT_WINDOW;
  const setWindowDays = (value: number) =>
    setSearchParams(
      previous => {
        const next = new URLSearchParams(previous);
        if (value === DEFAULT_WINDOW) next.delete('window');
        else next.set('window', String(value));
        return next;
      },
      { replace: true },
    );
  return [windowDays, setWindowDays] as const;
}

/** Merging without approval is fine now and then, not as a habit. */
function approvalTone(withoutApproval: number | null | undefined) {
  if (withoutApproval === null || withoutApproval === undefined) {
    return undefined;
  }
  if (withoutApproval > 0.2) return 'danger';
  if (withoutApproval > 0.05) return 'warning';
  return 'success';
}

const ReviewCard = ({ days, team }: { days: number; team?: string }) => {
  const reviews = useAgileAnalytics<ReviewSummary | null>(
    scopedPath('reviews', { days, team }),
  );
  const summary = reviews.value;
  const repositories = [...(summary?.repositories ?? [])]
    .sort((a, b) => b.merged - a.merged)
    .slice(0, MAX_REVIEW_REPOSITORIES);
  const withoutApproval = summary?.without_approval_share;

  return (
    <LoadState
      loading={reviews.loading}
      error={reviews.error}
      what="the code reviews"
      isEmpty={!summary?.merged}
      empty={`No merged merge requests in the last ${days} days.`}
    >
      {() => (
        <Card>
          <CardHeader>
            <Text variant="title-small" as="h2">
              Code review
            </Text>
            <Text variant="body-small" color="secondary">
              Merged merge requests in the last {days} days
            </Text>
          </CardHeader>
          <CardBody>
            <Flex direction="column" gap="4">
              <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
                <KpiTile label="Merged" value={formatNumber(summary!.merged)} />
                <KpiTile
                  label="Merged without approval"
                  value={formatShare(withoutApproval)}
                  tone={approvalTone(withoutApproval)}
                  hint={`${formatNumber(
                    summary!.without_approval,
                  )} merge requests`}
                />
                <KpiTile
                  label="Wait for first approval"
                  value={formatHours(summary!.wait_to_first_approval_hours.p50)}
                  hint={`Median; 1 in 4 waits over ${formatHours(
                    summary!.wait_to_first_approval_hours.p75,
                  )}`}
                />
                <KpiTile
                  label="Open to merged"
                  value={formatHours(summary!.created_to_merged_hours.p50)}
                  hint={`Median; 1 in 4 takes over ${formatHours(
                    summary!.created_to_merged_hours.p75,
                  )}`}
                />
              </Grid.Root>
              <SimpleTable<ReviewRow>
                label="Code review per repository"
                rows={repositories}
                rowKey={r => r.repository}
                columns={[
                  {
                    key: 'repository',
                    label: 'Repository',
                    render: r => repositoryName(r.repository),
                  },
                  {
                    key: 'merged',
                    label: 'Merged',
                    align: 'right',
                    render: r => r.merged,
                  },
                  {
                    key: 'without',
                    label: 'Without approval',
                    align: 'right',
                    render: r => formatShare(r.without_approval_share),
                  },
                  {
                    key: 'wait',
                    label: 'Wait for approval',
                    align: 'right',
                    render: r =>
                      formatHours(r.wait_to_first_approval_hours.p50),
                  },
                  {
                    key: 'merge',
                    label: 'Open to merged',
                    align: 'right',
                    render: r => formatHours(r.created_to_merged_hours.p50),
                  },
                ]}
              />
            </Flex>
          </CardBody>
        </Card>
      )}
    </LoadState>
  );
};

const OwnershipSection = ({
  data,
  team,
}: {
  data: Collaboration;
  team?: string;
}) => {
  const summary = summariseCollaboration(data, team);
  return (
    <>
      <Grid.Root columns={{ initial: '2', md: '5' }} gap="3">
        <KpiTile
          label="People active"
          value={`${summary.activePeople} / ${summary.people}`}
          hint={
            data.inactive_days
              ? `Worked in the last ${data.inactive_days} days`
              : undefined
          }
        />
        {STATUSES.map(status => (
          <KpiTile
            key={status.id}
            label={`${status.label} repositories`}
            value={formatNumber(summary.statusCounts[status.id])}
            tone={summary.statusCounts[status.id] ? status.tone : undefined}
            title={status.description}
          />
        ))}
      </Grid.Root>

      {summary.repositories.length ? (
        <Card>
          <CardHeader>
            <Text variant="title-small" as="h2">
              Who works on what
            </Text>
            <Text variant="body-small" color="secondary">
              People and the repositories they worked on over the chosen
              history, what needs attention on top. Point at a name to follow
              its lines.
            </Text>
          </CardHeader>
          <CardBody>
            <OwnershipGraph
              data={{ people: data.people, repositories: summary.repositories }}
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <Text variant="title-small" as="h2">
            Repositories that need an owner
          </Text>
          <Text variant="body-small" color="secondary">
            Orphaned and at risk repositories, busiest first. The bus factor is
            how many active people know the repository.
          </Text>
        </CardHeader>
        <CardBody>
          <SimpleTable<RepositoryRow>
            label="Repositories that need an owner"
            rows={summary.attention.slice(0, MAX_ATTENTION)}
            rowKey={r => r.repository}
            empty="Every repository has active people who know it."
            columns={[
              {
                key: 'repository',
                label: 'Repository',
                render: r => repositoryName(r.repository),
              },
              {
                key: 'status',
                label: 'Status',
                render: r => (
                  <Text
                    variant="body-small"
                    color={STATUS_BY_ID[r.status]?.tone}
                  >
                    {STATUS_BY_ID[r.status]?.label ?? r.status}
                  </Text>
                ),
              },
              {
                key: 'bus',
                label: 'Bus factor',
                align: 'right',
                render: r => r.bus_factor,
              },
              {
                key: 'owners',
                label: 'Known by',
                render: r => describeOwners(r.owners) || '–',
              },
              {
                key: 'teams',
                label: 'Teams',
                render: r => r.teams.join(', ') || 'No team',
              },
              {
                key: 'last',
                label: 'Last work',
                render: r => r.last_activity ?? '–',
              },
            ]}
          />
          {summary.attention.length > MAX_ATTENTION ? (
            <Link
              href={areaUrl('collaboration')!}
              {...external}
              variant="body-small"
              color="secondary"
            >
              …and {summary.attention.length - MAX_ATTENTION} more in Agile
              Analytics
            </Link>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Text variant="title-small" as="h2">
            Teams
          </Text>
          <Text variant="body-small" color="secondary">
            Coverage is the share of a team's repositories its members work on;
            focus is the share of their work that goes to them.
          </Text>
        </CardHeader>
        <CardBody>
          <SimpleTable<TeamRow>
            label="Team coverage and focus"
            rows={summary.teams}
            rowKey={t => t.hash}
            empty="No teams set up in Agile Analytics."
            columns={[
              { key: 'name', label: 'Team', render: t => t.name },
              {
                key: 'members',
                label: 'Members',
                align: 'right',
                render: t => t.members.length,
              },
              {
                key: 'repositories',
                label: 'Repositories',
                align: 'right',
                render: t => t.repositories.length,
              },
              {
                key: 'coverage',
                label: 'Coverage',
                align: 'right',
                render: t => formatShare(t.coverage),
              },
              {
                key: 'focus',
                label: 'Focus',
                align: 'right',
                render: t => formatShare(t.focus),
              },
            ]}
          />
          {!team && data.repositories_without_team?.length ? (
            <Text variant="body-x-small" color="secondary">
              {data.repositories_without_team.length === 1
                ? '1 repository has no team.'
                : `${data.repositories_without_team.length} repositories have no team.`}
            </Text>
          ) : null}
        </CardBody>
      </Card>
    </>
  );
};

/** Code review habits, and who knows which repositories. */
export const CollaborationPage = () => {
  const { team, days } = useScope();
  const [windowDays, setWindowDays] = useWindowDays();
  const collaboration = useAgileAnalytics<Collaboration | null>(
    `collaboration?windowDays=${windowDays}`,
  );

  return (
    <Container>
      <Flex direction="column" gap="4" py="4">
        <ScopeBar note="The period applies to code review; ownership looks at the chosen history.">
          <Select
            label="Ownership history"
            size="small"
            options={COLLABORATION_WINDOWS.map(d => ({
              value: String(d),
              label: `${d / 365} year${d === 365 ? '' : 's'}`,
            }))}
            selectedKey={String(windowDays)}
            onSelectionChange={key => key && setWindowDays(Number(key))}
          />
        </ScopeBar>
        <ReviewCard days={days} team={team} />
        <LoadState
          loading={collaboration.loading}
          error={collaboration.error}
          what="the collaboration"
          height={360}
          isEmpty={!collaboration.value}
          empty="Agile Analytics has no repository activity yet."
        >
          {() => <OwnershipSection data={collaboration.value!} team={team} />}
        </LoadState>
      </Flex>
    </Container>
  );
};
