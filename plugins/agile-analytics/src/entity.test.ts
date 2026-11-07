import {
  agileAnalyticsRepository,
  agileAnalyticsService,
  isAgileAnalyticsRepositoryAvailable,
  isAgileAnalyticsServiceAvailable,
} from './entity';

const entity = (annotations: Record<string, string>) => ({
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'x', annotations },
});

describe('entity', () => {
  it('reads the Agile Analytics service annotation', () => {
    expect(
      agileAnalyticsService(
        entity({ 'agileanalytics.cloud/service': ' api ' }),
      ),
    ).toBe('api');
    expect(
      isAgileAnalyticsServiceAvailable(
        entity({ 'agileanalytics.cloud/service': '' }),
      ),
    ).toBe(false);
    expect(isAgileAnalyticsServiceAvailable(entity({}))).toBe(false);
  });

  it('reads the repository annotation, falling back to the GitHub or GitLab slug', () => {
    expect(
      agileAnalyticsRepository(
        entity({
          'agileanalytics.cloud/repository': 'acme/api',
          'gitlab.com/project-slug': 'acme/other',
        }),
      ),
    ).toBe('acme/api');
    expect(
      agileAnalyticsRepository(
        entity({ 'gitlab.com/project-slug': 'acme/web ' }),
      ),
    ).toBe('acme/web');
    expect(
      agileAnalyticsRepository(
        entity({
          'github.com/project-slug': 'acme/gh',
          'gitlab.com/project-slug': 'acme/gl',
        }),
      ),
    ).toBe('acme/gh');
    expect(isAgileAnalyticsRepositoryAvailable(entity({}))).toBe(false);
  });
});
