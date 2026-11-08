import { useState } from 'react';
import {
  Button,
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
  KudosFlows,
  KudosSummary,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { topFifthShare } from '../../collaboration';
import { formatNumber, formatShare } from '../../format';
import { useAgileAnalytics } from '../../hooks';
import { areaUrl } from '../../links';
import { scopedPath, useScope } from '../../scope';
import { KpiTile } from '../KpiTile';
import { KudosSankey } from '../KudosSankey';
import { LoadState } from '../LoadState';
import { ScopeBar } from '../ScopeBar';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const TOP = 10;
/** Gold, silver and bronze, as the leaderboard of Agile Analytics. */
const PODIUM = ['#e8c547', '#a7b0bd', '#c96a3b'];

/** People by the kudos they gave or got, most first. */
export function rankPeople(
  flows: KudosFlows['flows'],
  side: 'from' | 'to',
): { name: string; kudos: number }[] {
  const totals = new Map<string, number>();
  for (const flow of flows) {
    totals.set(flow[side], (totals.get(flow[side]) ?? 0) + flow.kudos);
  }
  return [...totals]
    .map(([name, kudos]) => ({ name, kudos }))
    .sort((a, b) => b.kudos - a.kudos || a.name.localeCompare(b.name));
}

/** A ranked list with a bar per person, the top three in podium colours. */
const Leaderboard = ({
  title,
  description,
  people,
}: {
  title: string;
  description: string;
  people: { name: string; kudos: number }[];
}) => {
  const [all, setAll] = useState(false);
  const shown = all ? people : people.slice(0, TOP);
  const max = Math.max(1, ...people.map(p => p.kudos));
  // People with as many kudos share a rank
  const rankOf = (kudos: number) =>
    people.findIndex(p => p.kudos === kudos) + 1;
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          {title}
        </Text>
        <Text variant="body-small" color="secondary">
          {description}
        </Text>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap="2">
          <ol
            aria-label={title}
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {shown.map(person => {
              const rank = rankOf(person.kudos);
              return (
                <li key={person.name}>
                  <Flex align="center" gap="2">
                    <span
                      aria-label={`Rank ${rank}`}
                      style={{
                        width: 24,
                        height: 24,
                        flexShrink: 0,
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        background:
                          PODIUM[rank - 1] ?? 'var(--bui-bg-neutral-2)',
                        color: PODIUM[rank - 1] ? '#1b1b1b' : 'inherit',
                      }}
                    >
                      {rank}
                    </span>
                    <Text
                      variant="body-small"
                      truncate
                      style={{ width: 160, flexShrink: 0 }}
                    >
                      {person.name}
                    </Text>
                    <div
                      aria-hidden
                      style={{
                        flex: 1,
                        height: 8,
                        borderRadius: 'var(--bui-radius-full)',
                        background: 'var(--bui-bg-neutral-2)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${(person.kudos / max) * 100}%`,
                          height: '100%',
                          background: 'var(--bui-fg-positive)',
                        }}
                      />
                    </div>
                    <Text
                      variant="body-small"
                      weight="bold"
                      style={{ width: 40, textAlign: 'right', flexShrink: 0 }}
                    >
                      {person.kudos}
                    </Text>
                  </Flex>
                </li>
              );
            })}
          </ol>
          {people.length > TOP ? (
            <Flex>
              <Button
                variant="tertiary"
                size="small"
                onPress={() => setAll(previous => !previous)}
              >
                {all ? `Show the top ${TOP}` : `Show all ${people.length}`}
              </Button>
            </Flex>
          ) : null}
        </Flex>
      </CardBody>
    </Card>
  );
};

/** Who thanked whom, as the Kudos page of Agile Analytics. The messages stay there. */
export const KudosPage = () => {
  const { team, days } = useScope();
  const kudos = useAgileAnalytics<KudosSummary>(
    scopedPath('kudos', { days, team }),
  );
  const flows = useAgileAnalytics<KudosFlows>(
    scopedPath('kudos/flows', { days, team }),
  );
  const summary = kudos.value;
  const topShare = summary ? topFifthShare(summary.distribution) : null;
  const allFlows = flows.value?.flows ?? [];

  return (
    <Container>
      <Flex direction="column" gap="4" py="4">
        <ScopeBar
          note={team ? 'Kudos received by the members of the team.' : undefined}
        />
        <LoadState
          loading={kudos.loading}
          error={kudos.error}
          what="the kudos"
          height={360}
          isEmpty={!summary?.total}
          empty={
            <>
              No kudos given in the last {days} days.{' '}
              <Link href={areaUrl('kudos')!} {...external}>
                Kudos in Agile Analytics
              </Link>
            </>
          }
        >
          {() => (
            <>
              <Grid.Root columns={{ initial: '2', md: '4' }} gap="3">
                <KpiTile label="Kudos" value={formatNumber(summary!.total)} />
                <KpiTile
                  label="People thanked"
                  value={formatNumber(summary!.receivers)}
                  hint={
                    summary!.people
                      ? `${formatShare(
                          summary!.receivers / summary!.people,
                        )} of ${formatNumber(summary!.people)} people`
                      : undefined
                  }
                />
                <KpiTile
                  label="People thanking"
                  value={formatNumber(summary!.givers)}
                />
                <KpiTile
                  label="Kudos to the most thanked fifth"
                  value={formatShare(topShare)}
                  hint={
                    topShare === null
                      ? 'Needs five people thanked'
                      : 'Lower means thanks are spread more widely'
                  }
                />
              </Grid.Root>
              <Card>
                <CardHeader>
                  <Text variant="title-small" as="h2">
                    Who thanked whom
                  </Text>
                  <Text variant="body-small" color="secondary">
                    Each band is as wide as the kudos it carries; point at a
                    name to follow it.
                  </Text>
                </CardHeader>
                <CardBody>
                  {allFlows.length ? <KudosSankey flows={allFlows} /> : null}
                  {flows.error ? (
                    <Text variant="body-small" color="secondary">
                      Could not load who thanked whom: {flows.error.message}
                    </Text>
                  ) : null}
                </CardBody>
              </Card>
              {allFlows.length ? (
                <Grid.Root columns={{ initial: '1', md: '2' }} gap="4">
                  <Leaderboard
                    title="Most thanked"
                    description={`Kudos received in the last ${days} days`}
                    people={rankPeople(allFlows, 'to')}
                  />
                  <Leaderboard
                    title="Most thankful"
                    description={`Kudos given in the last ${days} days`}
                    people={rankPeople(allFlows, 'from')}
                  />
                </Grid.Root>
              ) : null}
            </>
          )}
        </LoadState>
      </Flex>
    </Container>
  );
};
