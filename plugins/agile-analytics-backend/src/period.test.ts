import { periodFor, weekBoundaries } from './period';

// Thursday 29 October 2026, 15:30 UTC
const NOW = Date.UTC(2026, 9, 29, 15, 30);

describe('periodFor', () => {
  it('ends at the start of the next UTC day', () => {
    const period = periodFor(14, NOW);
    expect(new Date(period.end * 1000).toISOString()).toBe(
      '2026-10-30T00:00:00.000Z',
    );
    expect(new Date(period.start * 1000).toISOString()).toBe(
      '2026-10-16T00:00:00.000Z',
    );
  });

  it('stays the same during the day', () => {
    expect(periodFor(7, Date.UTC(2026, 9, 29, 0, 1))).toEqual(
      periodFor(7, Date.UTC(2026, 9, 29, 23, 59)),
    );
  });
});

describe('weekBoundaries', () => {
  it('returns the last four Mondays and next Monday', () => {
    expect(
      weekBoundaries(NOW).map(s =>
        new Date(s * 1000).toISOString().slice(0, 10),
      ),
    ).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
    ]);
  });
});
