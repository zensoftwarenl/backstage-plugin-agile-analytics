import type { Entity } from '@backstage/catalog-model';

/**
 * Links a catalog entity to a service in Agile Analytics, as named on its
 * SLOs, e.g. `agileanalytics.cloud/service: api`.
 *
 * @public
 */
export const AGILE_ANALYTICS_SERVICE_ANNOTATION =
  'agileanalytics.cloud/service';

/** The Agile Analytics service an entity is linked to, if any. */
export function agileAnalyticsService(entity: Entity): string | undefined {
  return (
    entity.metadata.annotations?.[AGILE_ANALYTICS_SERVICE_ANNOTATION]?.trim() ||
    undefined
  );
}

/**
 * Whether an entity is linked to an Agile Analytics service, for use in an
 * `EntitySwitch.Case`.
 *
 * @public
 */
export function isAgileAnalyticsServiceAvailable(entity: Entity): boolean {
  return agileAnalyticsService(entity) !== undefined;
}

/**
 * Links a catalog entity to a repository in Agile Analytics, as its path on
 * the git host, e.g. `agileanalytics.cloud/repository: group/project`. Without
 * it the entity's GitHub or GitLab project slug is used.
 *
 * @public
 */
export const AGILE_ANALYTICS_REPOSITORY_ANNOTATION =
  'agileanalytics.cloud/repository';

/**
 * The standard Backstage annotations a repository is read from when
 * `agileanalytics.cloud/repository` is not set, in this order.
 */
export const REPOSITORY_FALLBACK_ANNOTATIONS = [
  'github.com/project-slug',
  'gitlab.com/project-slug',
] as const;

/** The repository an entity is linked to, if any. */
export function agileAnalyticsRepository(entity: Entity): string | undefined {
  const annotations = entity.metadata.annotations ?? {};
  for (const name of [
    AGILE_ANALYTICS_REPOSITORY_ANNOTATION,
    ...REPOSITORY_FALLBACK_ANNOTATIONS,
  ]) {
    const value = annotations[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

/**
 * Whether an entity is linked to a repository, for use in an
 * `EntitySwitch.Case`.
 *
 * @public
 */
export function isAgileAnalyticsRepositoryAvailable(entity: Entity): boolean {
  return agileAnalyticsRepository(entity) !== undefined;
}
