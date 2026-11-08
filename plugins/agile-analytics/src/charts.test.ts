import { aiPerBucket } from './ai';
import { dailyMeans } from './dora';
import { deploymentMarkers } from './components/ErrorBudgetsPage/ErrorBudgetsPage';
import { formatWait } from './components/DoraPage/DoraPage';
import { rankPeople } from './components/KudosPage/KudosPage';
import { arcWidth } from './components/HealthRing';
import { sankeyLayout } from './components/KudosSankey';
import { ownershipLayout } from './components/OwnershipGraph';
import { niceTicks, thinPoints } from './components/TimeChart';

describe('the health ring', () => {
  it('draws a third thicker the better its score', () => {
    expect(arcWidth(0)).toBe(3);
    expect(arcWidth(100)).toBe(28);
    expect(arcWidth(150)).toBe(28);
    expect(arcWidth(50)).toBeCloseTo(15.5);
  });
});

describe('niceTicks', () => {
  it('picks round steps', () => {
    expect(niceTicks(0, 100)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(-12, 80)).toEqual([-25, 0, 25, 50, 75, 100]);
    expect(niceTicks(0.2, 0.9)).toEqual([0.2, 0.4, 0.6, 0.8, 1]);
  });
});

describe('thinPoints', () => {
  it('keeps the lowest and highest of each slot', () => {
    const points: [number, number][] = Array.from({ length: 100 }, (_, i) => [
      i,
      i === 42 ? -50 : 10,
    ]);
    const thinned = thinPoints(points, 10);
    expect(thinned.length).toBeLessThanOrEqual(20);
    expect(thinned).toContainEqual([42, -50]);
  });

  it('leaves short series alone', () => {
    const points: [number, number][] = [
      [0, 1],
      [1, 2],
    ];
    expect(thinPoints(points, 10)).toBe(points);
  });
});

describe('sankeyLayout', () => {
  const flows = [
    { from: 'Ada', to: 'Linus', kudos: 6 },
    { from: 'Ada', to: 'Grace', kudos: 2 },
    { from: 'Grace', to: 'Linus', kudos: 2 },
  ];

  it('ranks givers and receivers by their kudos', () => {
    const { givers, receivers } = sankeyLayout(flows, 200);
    expect(givers.map(g => [g.name, g.total])).toEqual([
      ['Ada', 8],
      ['Grace', 2],
    ]);
    expect(receivers.map(r => [r.name, r.total])).toEqual([
      ['Linus', 8],
      ['Grace', 2],
    ]);
  });

  it('fills a node exactly with its bands, at both ends', () => {
    const { givers, receivers, links } = sankeyLayout(flows, 200);
    const ada = givers[0];
    const out = links.filter(l => l.from === 'Ada');
    expect(out.reduce((sum, l) => sum + l.width, 0)).toBeCloseTo(ada.height);
    expect(Math.min(...out.map(l => l.y0))).toBeCloseTo(ada.y);
    const linus = receivers[0];
    const into = links.filter(l => l.to === 'Linus');
    expect(Math.min(...into.map(l => l.y1))).toBeCloseTo(linus.y);
    expect(into.reduce((sum, l) => sum + l.width, 0)).toBeCloseTo(linus.height);
  });
});

describe('ownershipLayout', () => {
  it('puts what needs attention on top and the busiest person first', () => {
    const layout = ownershipLayout({
      people: [
        { id: 1, name: 'Ada', active: true },
        { id: 2, name: 'Linus', active: false },
      ],
      repositories: [
        {
          repository: 'a/healthy',
          status: 'healthy',
          activity: 10,
          bus_factor: 2,
          teams: [],
          owners: [
            { person_id: 1, name: 'Ada', share: 0.9, active: true },
            { person_id: 2, name: 'Linus', share: 0.1, active: false },
          ],
        },
        {
          repository: 'a/orphaned',
          status: 'orphaned',
          activity: 1,
          bus_factor: 0,
          teams: [],
          owners: [{ person_id: 2, name: 'Linus', share: 1, active: false }],
        },
      ],
    });
    expect(layout.groups.map(g => g.status)).toEqual(['orphaned', 'healthy']);
    expect(layout.repositories.map(r => r.repository)).toEqual([
      'a/orphaned',
      'a/healthy',
    ]);
    expect(layout.people.map(p => p.name)).toEqual(['Ada', 'Linus']);
    expect(layout.links).toHaveLength(3);
  });
});

describe('aiPerBucket', () => {
  const now = new Date(2026, 10, 7, 15).getTime();
  const at = (daysAgo: number) =>
    (new Date(2026, 10, 7, 10).getTime() - daysAgo * 86_400_000) / 1000;

  it('counts merged work per day by whether AI helped', () => {
    const buckets = aiPerBucket(
      [
        { repository: 'r', merged_date: at(0), ai_assisted: true },
        { repository: 'r', merged_date: at(0), ai_assisted: false },
        { repository: 'r', merged_date: at(2), ai_assisted: null },
        // Before the period
        { repository: 'r', merged_date: at(30), ai_assisted: true },
      ],
      7,
      now,
    );
    expect(buckets).toHaveLength(7);
    expect(buckets[6]).toMatchObject({ aiAssisted: 1, notAiAssisted: 1 });
    expect(buckets[4]).toMatchObject({ unattributed: 1 });
    expect(
      buckets.reduce((sum, b) => sum + b.aiAssisted + b.notAiAssisted, 0),
    ).toBe(2);
  });

  it('counts per week over more than a month', () => {
    expect(aiPerBucket([], 90, now)).toHaveLength(13);
  });
});

describe('rankPeople', () => {
  const flows = [
    { from: 'Ada', to: 'Linus', kudos: 6 },
    { from: 'Ada', to: 'Grace', kudos: 2 },
    { from: 'Grace', to: 'Linus', kudos: 2 },
  ];

  it('ranks who got and who gave the most kudos', () => {
    expect(rankPeople(flows, 'to')).toEqual([
      { name: 'Linus', kudos: 8 },
      { name: 'Grace', kudos: 2 },
    ]);
    expect(rankPeople(flows, 'from')).toEqual([
      { name: 'Ada', kudos: 8 },
      { name: 'Grace', kudos: 2 },
    ]);
  });
});

describe('dailyMeans', () => {
  it('averages the values of each day, at noon', () => {
    const day = 20_000 * 86_400;
    expect(
      dailyMeans([
        { time: day + 3600, value: 2 },
        { time: day + 7200, value: 4 },
        { time: day + 86_400, value: 1 },
      ]),
    ).toEqual([
      [(day + 43_200) * 1000, 3],
      [(day + 86_400 + 43_200) * 1000, 1],
    ]);
  });
});

describe('deploymentMarkers', () => {
  it('marks each day with production deployments once', () => {
    const day = 20_000 * 86_400;
    const markers = deploymentMarkers([
      { repository: 'a/api', timestamp: day + 10, production: true },
      { repository: 'a/web', timestamp: day + 20, production: true },
      { repository: 'a/web', timestamp: day + 30, production: false },
      { repository: 'a/api', timestamp: day + 86_400, production: true },
    ]);
    expect(markers).toHaveLength(2);
    expect(markers[0].label).toMatch(/^2 deployments on .*: a\/api, a\/web$/);
    expect(markers[1].label).toMatch(/^1 deployment on /);
  });
});

describe('formatWait', () => {
  it('picks the unit that reads best', () => {
    expect(formatWait(0.42)).toBe('0.4 s');
    expect(formatWait(12.4)).toBe('12 s');
    expect(formatWait(204)).toBe('3.4 min');
    expect(formatWait(4320)).toBe('1.2 h');
    expect(formatWait(null)).toBe('–');
  });
});
