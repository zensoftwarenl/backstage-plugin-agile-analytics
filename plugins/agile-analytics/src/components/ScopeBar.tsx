import { Flex, Select, Text } from '@backstage/ui';
import {
  Organisation,
  PERIOD_DAYS,
  Team,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import type { ReactNode } from 'react';
import { useAgileAnalytics } from '../hooks';
import { useScope } from '../scope';

const ORGANISATION = 'org';

/**
 * Picks the team and period a tab shows. Tabs pass `teams={false}` or
 * `period={false}` where Agile Analytics cannot narrow the data down.
 */
export const ScopeBar = ({
  teams: showTeams = true,
  period: showPeriod = true,
  note,
  children,
}: {
  teams?: boolean;
  period?: boolean;
  /** Says what the selection does not apply to. */
  note?: ReactNode;
  children?: ReactNode;
}) => {
  const { team, days, setTeam, setDays } = useScope();
  const organisation = useAgileAnalytics<Organisation>(
    showTeams ? 'organisation' : undefined,
  );
  const teams = useAgileAnalytics<Team[]>(showTeams ? 'teams' : undefined);
  const orgName = organisation.value?.org_name?.trim();

  return (
    <Flex justify="between" align="end" gap="3" style={{ flexWrap: 'wrap' }}>
      <Flex align="end" gap="3" style={{ flexWrap: 'wrap' }}>
        {showTeams ? (
          <Select
            label="Team"
            size="small"
            options={[
              {
                value: ORGANISATION,
                label: orgName ? `${orgName} (all teams)` : 'All teams',
              },
              ...(Array.isArray(teams.value) ? teams.value : []).map(t => ({
                value: t.team_hash,
                label: t.team_name,
              })),
            ]}
            selectedKey={team ?? ORGANISATION}
            onSelectionChange={key =>
              key &&
              setTeam(String(key) === ORGANISATION ? undefined : String(key))
            }
            isDisabled={teams.loading}
          />
        ) : null}
        {showPeriod ? (
          <Select
            label="Period"
            size="small"
            options={PERIOD_DAYS.map(d => ({
              value: String(d),
              label: `Last ${d} days`,
            }))}
            selectedKey={String(days)}
            onSelectionChange={key => key && setDays(Number(key))}
          />
        ) : null}
        {children}
      </Flex>
      {note ? (
        <Text variant="body-x-small" color="secondary">
          {note}
        </Text>
      ) : null}
    </Flex>
  );
};
