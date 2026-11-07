import type { Collaboration } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import {
  describeOwners,
  summariseCollaboration,
  topFifthShare,
} from './collaboration';

const owner = (
  person_id: number,
  name: string,
  share: number,
  active = true,
) => ({
  person_id,
  name,
  share,
  active,
});

const data: Collaboration = {
  as_of: '2026-10-29',
  window_start: '2024-10-29',
  people: [
    { id: 1, name: 'Ann', active: true },
    { id: 2, name: 'Bob', active: false },
    { id: 3, name: 'Cas', active: true },
  ],
  repositories: [
    {
      repository: 'acme/api',
      status: 'healthy',
      bus_factor: 2,
      teams: ['Platform'],
      owners: [owner(1, 'Ann', 0.6), owner(3, 'Cas', 0.4)],
    },
    {
      repository: 'acme/old',
      status: 'orphaned',
      activity: 1,
      bus_factor: 0,
      teams: [],
      owners: [owner(2, 'Bob', 1, false)],
    },
    {
      repository: 'acme/web',
      status: 'at_risk',
      activity: 9,
      bus_factor: 1,
      teams: ['Platform'],
      owners: [owner(1, 'Ann', 1)],
    },
    {
      repository: 'acme/cli',
      status: 'at_risk',
      activity: 20,
      bus_factor: 1,
      teams: [],
      owners: [owner(3, 'Cas', 1)],
    },
  ],
  teams: [
    {
      hash: 't1',
      name: 'Platform',
      members: [1, 2],
      repositories: ['acme/api', 'acme/web'],
      coverage: 1,
      focus: 0.8,
    },
  ],
};

describe('summariseCollaboration', () => {
  it('counts people and repositories, worst first', () => {
    const summary = summariseCollaboration(data);

    expect(summary.activePeople).toBe(2);
    expect(summary.people).toBe(3);
    expect(summary.statusCounts).toEqual({
      orphaned: 1,
      at_risk: 2,
      dormant: 0,
      healthy: 1,
    });
    expect(summary.attention.map(r => r.repository)).toEqual([
      'acme/old',
      'acme/cli',
      'acme/web',
    ]);
  });

  it("narrows to a team's members and repositories", () => {
    const summary = summariseCollaboration(data, 't1');

    expect(summary.people).toBe(2);
    expect(summary.activePeople).toBe(1);
    expect(summary.attention.map(r => r.repository)).toEqual(['acme/web']);
    expect(summary.teams.map(t => t.hash)).toEqual(['t1']);
  });
});

describe('describeOwners', () => {
  it('names the people who know a repository best', () => {
    expect(
      describeOwners([owner(2, 'Bob', 0.3, false), owner(1, 'Ann', 0.7)]),
    ).toBe('Ann (70%), Bob (30%, inactive)');
  });

  it('measures how much kudos the most thanked fifth gets', () => {
    expect(topFifthShare([6, 1, 1, 1, 1])).toBe(0.6);
    expect(topFifthShare([5, 5, 5, 5, 5, 5])).toBeCloseTo(10 / 30);
    expect(topFifthShare([3, 1])).toBeNull();
  });
});
