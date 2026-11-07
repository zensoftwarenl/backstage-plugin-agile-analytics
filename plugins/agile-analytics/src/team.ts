import {
  type Entity,
  RELATION_PARENT_OF,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import type { CatalogApi } from '@backstage/plugin-catalog-react';
import type { SloReportMetric } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { agileAnalyticsService } from './entity';
import { type SloSummary, summariseSlos } from './slos';

/** Component types that run, and so can have SLOs without the annotation. */
const SERVICE_TYPES = ['service', 'website'];

/**
 * The group and the teams below it, however deep, so the org group shows the
 * services of all of its teams.
 */
export async function groupAndDescendants(
  catalogApi: CatalogApi,
  group: Entity,
): Promise<string[]> {
  const seen = new Set([stringifyEntityRef(group).toLowerCase()]);
  let level = [group];
  while (level.length) {
    const children = level
      .flatMap(g => g.relations ?? [])
      .filter(r => r.type === RELATION_PARENT_OF)
      .map(r => r.targetRef.toLowerCase())
      .filter(ref => !seen.has(ref));
    if (!children.length) break;
    children.forEach(ref => seen.add(ref));
    const { items } = await catalogApi.getEntitiesByRefs({
      entityRefs: children,
      fields: ['kind', 'metadata.name', 'metadata.namespace', 'relations'],
    });
    level = items.filter((e): e is Entity => !!e);
  }
  return [...seen];
}

/** The services the group and its teams own. */
export async function servicesOwnedBy(
  catalogApi: CatalogApi,
  group: Entity,
): Promise<Entity[]> {
  const owners = await groupAndDescendants(catalogApi, group);
  const { items } = await catalogApi.getEntities({
    filter: { kind: 'Component', 'relations.ownedBy': owners },
    fields: [
      'kind',
      'metadata.name',
      'metadata.namespace',
      'metadata.title',
      'metadata.annotations',
      'spec.type',
      'spec.owner',
    ],
  });
  return items.filter(
    e =>
      agileAnalyticsService(e) !== undefined ||
      SERVICE_TYPES.includes(String(e.spec?.type ?? '').toLowerCase()),
  );
}

export type TeamService = {
  entity: Entity;
  /** The Agile Analytics service it is linked to, if any. */
  service?: string;
  summary: SloSummary;
};

/** The lowest error budget of a service, or none without SLOs. */
const lowestBudget = (s: TeamService) =>
  s.summary.lowest.length ? Number(s.summary.lowest[0].errorBudget) : Infinity;

/**
 * Each service with its SLOs: the ones with the least budget left first, then
 * those without SLOs yet, then those not linked to Agile Analytics.
 */
export function teamServices(
  entities: Entity[],
  metrics: SloReportMetric[] | null | undefined,
): TeamService[] {
  // Service names on SLOs are matched the way the error budget page anchors them
  const services = entities.map(entity => {
    const service = agileAnalyticsService(entity);
    const summary = summariseSlos(
      service
        ? metrics?.filter(
            slo => slo.service?.toLowerCase() === service.toLowerCase(),
          )
        : [],
    );
    return { entity, service, summary };
  });
  const rank = (s: TeamService) => {
    if (s.summary.total) return 0;
    return s.service ? 1 : 2;
  };
  const name = (s: TeamService) =>
    (s.entity.metadata.title ?? s.entity.metadata.name).toLowerCase();
  return services.sort(
    (a, b) =>
      rank(a) - rank(b) ||
      lowestBudget(a) - lowestBudget(b) ||
      name(a).localeCompare(name(b)),
  );
}
