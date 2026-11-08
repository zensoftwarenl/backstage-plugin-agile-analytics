import { Card, CardBody, CardHeader, Flex, Text } from '@backstage/ui';
import type {
  HealthPillarId,
  TeamComparisonRow,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { PILLARS, scoreTone } from '../../health';
import { useAgileAnalytics } from '../../hooks';
import { scopedPath, useScope } from '../../scope';
import { LoadState } from '../LoadState';
import { SimpleTable } from '../SimpleTable';

type Column = 'total' | HealthPillarId;

const scoreOf = (
  scores: TeamComparisonRow | TeamComparisonRow['previous'],
  column: Column,
) => (column === 'total' ? scores?.total : scores?.pillars[column]) ?? null;

/** A score with how much it moved since the period before. */
const Score = ({ row, column }: { row: TeamComparisonRow; column: Column }) => {
  const now = scoreOf(row, column);
  const before = scoreOf(row.previous, column);
  if (now === null) {
    return <Text color="secondary">–</Text>;
  }
  const change = before === null ? null : Math.round(now - before);
  return (
    <Flex gap="1" align="baseline" justify="end">
      <Text weight="bold" color={scoreTone(now)}>
        {Math.round(now)}
      </Text>
      {change ? (
        <Text
          variant="body-x-small"
          color={change > 0 ? 'success' : 'danger'}
          title={`${Math.round(before!)} the period before`}
        >
          {change > 0 ? `▲${change}` : `▼${-change}`}
        </Text>
      ) : null}
    </Flex>
  );
};

/**
 * Every team's health and its thirds side by side, with the change since the
 * period before, as the team comparison of Agile Analytics. Lowest first.
 */
export const TeamComparisonCard = ({
  onSelect,
}: {
  onSelect: (teamHash: string) => void;
}) => {
  const { days } = useScope();
  const rows = useAgileAnalytics<TeamComparisonRow[]>(
    scopedPath('teams/health', { days }),
  );
  const sorted = [...(rows.value ?? [])].sort(
    (a, b) =>
      (a.total ?? 101) - (b.total ?? 101) ||
      a.team.name.localeCompare(b.team.name),
  );
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          Teams compared
        </Text>
        <Text variant="body-small" color="secondary">
          Each team's health over the last {days} days, lowest first; the arrows
          show the change since the {days} days before. Click a team to see its
          health.
        </Text>
      </CardHeader>
      <CardBody>
        <LoadState
          loading={rows.loading}
          error={rows.error}
          what="the team comparison"
          isEmpty={!sorted.length}
          empty="No teams in Agile Analytics yet."
        >
          {() => (
            <SimpleTable<TeamComparisonRow>
              label="Health per team"
              rows={sorted}
              rowKey={r => r.team.hash}
              columns={[
                {
                  key: 'team',
                  label: 'Team',
                  render: r => (
                    <button
                      type="button"
                      onClick={() => onSelect(r.team.hash)}
                      style={{
                        padding: 0,
                        border: 0,
                        background: 'none',
                        color: 'inherit',
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                        font: 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {r.team.name}
                    </button>
                  ),
                },
                {
                  key: 'total',
                  label: 'Health',
                  align: 'right',
                  render: r => <Score row={r} column="total" />,
                },
                ...PILLARS.map(pillar => ({
                  key: pillar.id,
                  label: pillar.name,
                  align: 'right' as const,
                  render: (r: TeamComparisonRow) => (
                    <Score row={r} column={pillar.id} />
                  ),
                })),
              ]}
            />
          )}
        </LoadState>
      </CardBody>
    </Card>
  );
};
