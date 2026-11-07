import {
  formatDuration,
  formatHours,
  formatShare,
  median,
  repositoryName,
} from './format';

describe('format', () => {
  it('formats durations in the largest fitting unit', () => {
    expect(formatDuration(90)).toBe('2 min');
    expect(formatDuration(5400)).toBe('1.5 h');
    expect(formatDuration(3 * 86_400)).toBe('3 d');
    expect(formatDuration(-7200)).toBe('-2 h');
    expect(formatDuration(null)).toBe('–');
    expect(formatHours(48)).toBe('2 d');
  });

  it('formats fractions as percentages', () => {
    expect(formatShare(0.4256)).toBe('42.6%');
    expect(formatShare(undefined)).toBe('–');
  });

  it('strips hosts and .git from repository paths', () => {
    expect(repositoryName('git@gitlab.com:acme/agile/api.git')).toBe(
      'acme/agile/api',
    );
    expect(repositoryName('https://github.com/acme/web/')).toBe('acme/web');
  });

  it('takes the median of even and odd lists', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});
