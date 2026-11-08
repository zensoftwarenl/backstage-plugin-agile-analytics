import { useLocation, useResolvedPath } from 'react-router-dom';
import { Alert, Container, Flex, Select } from '@backstage/ui';
import type {
  HealthReport,
  Organisation,
  Signal,
  Team,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { useAgileAnalytics } from '../../hooks';
import { useScope } from '../../scope';
import { DoraSummaryCard } from './DoraSummaryCard';
import { HealthCard } from './HealthCard';
import { InsightsCard } from './InsightsCard';
import { SignalsCard } from './SignalsCard';
import { TeamComparisonCard } from './TeamComparisonCard';

const ORGANISATION = 'org';

export const OverviewPage = () => {
  // The team lives in the URL, so a team's health can be linked to
  const { team, setTeam } = useScope();
  const scope = team ?? ORGANISATION;
  const setScope = (key: string) =>
    setTeam(key === ORGANISATION ? undefined : key);
  const organisation = useAgileAnalytics<Organisation>('organisation');
  const teams = useAgileAnalytics<Team[]>('teams');
  const health = useAgileAnalytics<HealthReport>(
    scope === ORGANISATION
      ? 'health'
      : `teams/${encodeURIComponent(scope)}/health`,
  );
  const signals = useAgileAnalytics<Signal[]>('signals');
  const dora = useResolvedPath('dora');
  const { search } = useLocation();

  const teamHash = scope === ORGANISATION ? undefined : scope;
  const orgName = organisation.value?.org_name?.trim();
  const teamOptions = [
    {
      value: ORGANISATION,
      label: orgName ? `${orgName} (all teams)` : 'All teams',
    },
    ...(Array.isArray(teams.value) ? teams.value : []).map(t => ({
      value: t.team_hash,
      label: t.team_name,
    })),
  ];

  return (
    <Container>
      <Flex direction="column" gap="4" py="4">
        {organisation.error ? (
          <Alert
            status="danger"
            title="Could not load Agile Analytics"
            description={organisation.error.message}
          />
        ) : null}
        <Flex justify="between" align="end">
          <Select
            label="Show the health of"
            size="small"
            options={teamOptions}
            selectedKey={scope}
            onSelectionChange={key => key && setScope(String(key))}
            isDisabled={teams.loading}
          />
        </Flex>
        <HealthCard
          report={health.value}
          teamHash={teamHash}
          loading={health.loading}
          error={health.error}
        />
        <InsightsCard teamHash={teamHash} />
        {scope === ORGANISATION && (teams.value?.length ?? 0) > 1 ? (
          <TeamComparisonCard onSelect={setScope} />
        ) : null}
        {scope === ORGANISATION ? (
          <DoraSummaryCard doraHref={`${dora.pathname}${search}`} />
        ) : null}
        {scope === ORGANISATION ? (
          <SignalsCard
            signals={signals.value}
            loading={signals.loading}
            error={signals.error}
          />
        ) : null}
      </Flex>
    </Container>
  );
};
