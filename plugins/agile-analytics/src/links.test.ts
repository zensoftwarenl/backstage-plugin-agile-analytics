import { areaUrl, overviewUrl, setAppUrl, signalUrl } from './links';

const APP = 'https://www.prod.agileanalytics.cloud';

describe('links', () => {
  it('links each area to the page behind it in Agile Analytics', () => {
    expect(areaUrl('delivery')).toBe(`${APP}/dora`);
    expect(areaUrl('execution')).toBe(`${APP}/sprint-insights`);
    expect(areaUrl('pulse')).toBe(`${APP}/overview#developer-experience`);
    expect(areaUrl('unknown')).toBeUndefined();
  });

  it('scopes the overview to a team', () => {
    expect(overviewUrl()).toBe(`${APP}/overview`);
    expect(overviewUrl('a b')).toBe(`${APP}/overview?team=a%20b`);
  });

  it('sends signals to their ticket, service or area', () => {
    expect(signalUrl({ kind: 'stale_work', url: 'https://jira/ABC-1' })).toBe(
      'https://jira/ABC-1',
    );
    expect(signalUrl({ kind: 'slo_resolved', service: 'API' })).toBe(
      `${APP}/error-budgets#api`,
    );
    expect(signalUrl({ kind: 'slipped', area: 'investment' })).toBe(
      `${APP}/hours`,
    );
    expect(signalUrl({ kind: 'bus_factor' })).toBeUndefined();
  });
});

describe('setAppUrl', () => {
  afterEach(() => setAppUrl(undefined));

  it('points the links at the configured app', () => {
    setAppUrl('https://aa.example.com/');
    expect(overviewUrl()).toBe('https://aa.example.com/overview');
    setAppUrl(undefined);
    expect(overviewUrl()).toBe(`${APP}/overview`);
  });
});
