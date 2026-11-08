import { useState } from 'react';
import { Flex, Text } from '@backstage/ui';
import type {
  Collaboration,
  RepositoryStatus,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { STATUSES, STATUS_BY_ID } from '../collaboration';
import { repositoryName } from '../format';
import { toneColor } from './charts';

// Who works on which repositories, as the column layout of the collaboration
// graph of Agile Analytics: people on the left, busiest first; repositories
// on the right, grouped by status with what needs attention on top.

const ROW = 24;
const GROUP_HEADING = 26;
const GROUP_GAP = 14;
const EDGE = 12;
const LABEL_ROOM = 170;

type Repository = Collaboration['repositories'][number];

export type OwnershipLayout = {
  height: number;
  people: {
    id: number;
    name: string;
    active: boolean;
    y: number;
    work: number;
  }[];
  repositories: (Repository & { y: number })[];
  groups: { status: RepositoryStatus; y: number; count: number }[];
  links: {
    person: number;
    repository: string;
    share: number;
    y0: number;
    y1: number;
  }[];
};

/** Places people and repositories so that the lines cross as little as possible. */
export function ownershipLayout(
  data: Pick<Collaboration, 'people' | 'repositories'>,
): OwnershipLayout {
  // How much of the repositories' work a person did, to rank them
  const work = new Map<number, number>();
  for (const repository of data.repositories) {
    for (const owner of repository.owners) {
      work.set(
        owner.person_id,
        (work.get(owner.person_id) ?? 0) +
          owner.share * Math.max(1, repository.activity ?? 1),
      );
    }
  }
  const names = new Map(data.people.map(p => [p.id, p]));
  const ranked = [...work]
    .sort((a, b) => b[1] - a[1])
    .map(([id, w]) => {
      const person = names.get(id);
      return {
        id,
        name: person?.display_name || person?.name || `#${id}`,
        active: person?.active ?? false,
        work: w,
      };
    });
  const row = new Map(ranked.map((p, i) => [p.id, i]));
  // A repository sits level with the people who work on it
  const level = (repository: Repository) => {
    let sum = 0;
    let weight = 0;
    for (const owner of repository.owners) {
      sum += (row.get(owner.person_id) ?? 0) * owner.share;
      weight += owner.share;
    }
    return weight ? sum / weight : 0;
  };

  const groups: OwnershipLayout['groups'] = [];
  const repositories: OwnershipLayout['repositories'] = [];
  let y = EDGE;
  for (const { id: status } of STATUSES) {
    const members = data.repositories
      .filter(r => r.status === status)
      .sort(
        (a, b) =>
          level(a) - level(b) || a.repository.localeCompare(b.repository),
      );
    if (!members.length) continue;
    groups.push({ status, y, count: members.length });
    y += GROUP_HEADING;
    for (const repository of members) {
      repositories.push({ ...repository, y: y + ROW / 2 });
      y += ROW;
    }
    y += GROUP_GAP;
  }
  const height = Math.max(240, y, ranked.length * ROW + 2 * EDGE);
  const spacing = (height - 2 * EDGE) / Math.max(1, ranked.length);
  const people = ranked.map((person, i) => ({
    ...person,
    y: EDGE + spacing * (i + 0.5),
  }));
  const personY = new Map(people.map(p => [p.id, p.y]));
  const links = repositories.flatMap(repository =>
    repository.owners
      .filter(owner => personY.has(owner.person_id))
      .map(owner => ({
        person: owner.person_id,
        repository: repository.repository,
        share: owner.share,
        y0: personY.get(owner.person_id)!,
        y1: repository.y,
      })),
  );
  return { height, people, repositories, groups, links };
}

export const OwnershipGraph = ({
  data,
}: {
  data: Pick<Collaboration, 'people' | 'repositories'>;
}) => {
  const [focus, setFocus] = useState<
    { person: number } | { repository: string } | null
  >(null);
  const layout = ownershipLayout(data);
  if (!layout.repositories.length) return null;
  const width = 1000;
  const lit = (link: OwnershipLayout['links'][number]) =>
    !focus ||
    ('person' in focus
      ? link.person === focus.person
      : link.repository === focus.repository);
  const personLit = (id: number) =>
    !focus ||
    ('person' in focus
      ? focus.person === id
      : layout.links.some(
          l => l.person === id && l.repository === focus.repository,
        ));
  const repositoryLit = (repository: string) =>
    !focus ||
    ('repository' in focus
      ? focus.repository === repository
      : layout.links.some(
          l => l.repository === repository && l.person === focus.person,
        ));

  const lineOpacity = (link: OwnershipLayout['links'][number]) => {
    if (!focus) return 0.4;
    return lit(link) ? 0.8 : 0.06;
  };

  const labelStyle = (y: number, shown: boolean) =>
    ({
      position: 'absolute',
      top: y,
      transform: 'translateY(-50%)',
      width: LABEL_ROOM - 10,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      opacity: shown ? 1 : 0.35,
      transition: 'opacity 150ms',
    } as const);

  return (
    <Flex direction="column" gap="2">
      <Flex gap="3" style={{ flexWrap: 'wrap' }}>
        {STATUSES.map(status => (
          <Text
            key={status.id}
            variant="body-x-small"
            color="secondary"
            title={status.description}
          >
            <span aria-hidden style={{ color: toneColor(status.tone) }}>
              ■{' '}
            </span>
            {status.label}
          </Text>
        ))}
        <Text variant="body-x-small" color="secondary">
          Thicker lines: a bigger share of the work. Faded names: no longer
          active.
        </Text>
      </Flex>
      <div style={{ display: 'flex', width: '100%', height: layout.height }}>
        <div style={{ position: 'relative', width: LABEL_ROOM, flexShrink: 0 }}>
          {layout.people.map(person => (
            <div
              key={person.id}
              style={{
                ...labelStyle(person.y, personLit(person.id)),
                right: 0,
                textAlign: 'right',
              }}
              onMouseEnter={() => setFocus({ person: person.id })}
              onMouseLeave={() => setFocus(null)}
            >
              <Text
                variant="body-x-small"
                color={person.active ? 'primary' : 'secondary'}
                style={person.active ? undefined : { fontStyle: 'italic' }}
              >
                {person.name}
              </Text>
            </div>
          ))}
        </div>
        <svg
          role="img"
          aria-label={`Who works on which repositories: ${layout.people.length} people and ${layout.repositories.length} repositories`}
          viewBox={`0 0 ${width} ${layout.height}`}
          preserveAspectRatio="none"
          width="100%"
          height={layout.height}
          style={{ flex: 1, minWidth: 0, display: 'block' }}
        >
          {layout.links.map(link => {
            const tone =
              STATUS_BY_ID[
                layout.repositories.find(r => r.repository === link.repository)!
                  .status
              ].tone;
            return (
              <path
                key={`${link.person}\u0000${link.repository}`}
                d={`M8,${link.y0} C${width / 2},${link.y0} ${width / 2},${
                  link.y1
                } ${width - 8},${link.y1}`}
                fill="none"
                stroke={toneColor(tone)}
                strokeOpacity={lineOpacity(link)}
                strokeWidth={1 + link.share * 6}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <div style={{ position: 'relative', width: LABEL_ROOM, flexShrink: 0 }}>
          {layout.groups.map(group => (
            <div
              key={group.status}
              style={{
                ...labelStyle(group.y + GROUP_HEADING / 2, true),
                left: 0,
                paddingLeft: 8,
              }}
            >
              <Text variant="body-x-small" weight="bold" color="secondary">
                {STATUS_BY_ID[group.status].label.toUpperCase()} ({group.count})
              </Text>
            </div>
          ))}
          {layout.repositories.map(repository => (
            <div
              key={repository.repository}
              title={`${repository.repository}: bus factor ${repository.bus_factor}`}
              style={{
                ...labelStyle(
                  repository.y,
                  repositoryLit(repository.repository),
                ),
                left: 0,
                paddingLeft: 8,
              }}
              onMouseEnter={() =>
                setFocus({ repository: repository.repository })
              }
              onMouseLeave={() => setFocus(null)}
            >
              <Text variant="body-x-small">
                <span
                  aria-hidden
                  style={{
                    color: toneColor(STATUS_BY_ID[repository.status].tone),
                  }}
                >
                  ●{' '}
                </span>
                {repositoryName(repository.repository).split('/').pop()}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </Flex>
  );
};
