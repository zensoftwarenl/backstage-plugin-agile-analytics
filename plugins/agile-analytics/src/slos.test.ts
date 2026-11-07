import { budgetTone, formatTarget, summariseSlos } from './slos';

describe('slos', () => {
  it('summarises SLOs like the Agile Analytics reliability tile', () => {
    const summary = summariseSlos([
      { id: 1, sloValue: 99.9, sloTarget: 0.99, errorBudget: 80 },
      { id: 2, sloValue: 98, sloTarget: 0.99, errorBudget: -5 },
      { id: 3, errorBudget: null },
    ]);

    expect(summary.total).toBe(2);
    expect(summary.onTarget).toBe(1);
    expect(summary.overBudget).toBe(1);
    expect(summary.lowest.map(slo => slo.id)).toEqual([2, 1]);
  });

  it('colours budgets and formats targets', () => {
    expect(budgetTone(-1)).toBe('danger');
    expect(budgetTone(10)).toBe('warning');
    expect(budgetTone(25)).toBe('success');
    expect(formatTarget(0.995)).toBe('99.5%');
  });
});
