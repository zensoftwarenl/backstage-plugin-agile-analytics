import type { Entity } from '@backstage/catalog-model';
import { fetchApiRef } from '@backstage/frontend-plugin-api';
import { renderInTestApp } from '@backstage/frontend-test-utils';
import {
  catalogApiRef,
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import { screen } from '@testing-library/react';
import { EntityTeamErrorBudgetsCard } from './EntityTeamErrorBudgetsCard';

const slos = {
  metrics: [
    {
      id: 1,
      sloName: 'Availability',
      service: 'api',
      sloValue: 99.2,
      sloTarget: 0.995,
      errorBudget: -12,
    },
    {
      id: 2,
      sloName: 'Latency',
      service: 'web',
      sloValue: 99.9,
      sloTarget: 0.99,
      errorBudget: 80,
    },
  ],
};

const group = (name: string, children: string[] = []): Entity => ({
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Group',
  metadata: { name, namespace: 'default' },
  spec: { type: 'team', children },
  relations: children.map(child => ({
    type: 'parentOf',
    targetRef: `group:default/${child}`,
  })),
});

const component = (
  name: string,
  owner: string,
  type: string,
  service?: string,
): Entity => ({
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name,
    namespace: 'default',
    annotations: service ? { 'agileanalytics.cloud/service': service } : {},
  },
  spec: { type, owner, lifecycle: 'production' },
  relations: [{ type: 'ownedBy', targetRef: `group:default/${owner}` }],
});

const entities = [
  group('org', ['team-a']),
  group('team-a'),
  component('web', 'org', 'website', 'web'),
  component('api', 'team-a', 'service', 'api'),
  component('worker', 'team-a', 'service'),
  component('sdk', 'team-a', 'library'),
  component('other', 'elsewhere', 'service', 'other'),
];

async function renderCard(entity: Entity) {
  const fetch = jest.fn(
    async () => new Response(JSON.stringify(slos), { status: 200 }),
  );
  await renderInTestApp(
    <EntityProvider entity={entity}>
      <EntityTeamErrorBudgetsCard />
    </EntityProvider>,
    {
      apis: [
        [fetchApiRef, { fetch }],
        [catalogApiRef, catalogApiMock({ entities })],
      ],
      mountedRoutes: { '/catalog/:namespace/:kind/:name': entityRouteRef },
    },
  );
  return fetch;
}

describe('EntityTeamErrorBudgetsCard', () => {
  it('lists the services of the group and its teams, lowest budget first', async () => {
    await renderCard(entities[0]);

    expect(
      await screen.findByText('1 of 2 SLOs over budget'),
    ).toBeInTheDocument();
    const services = Array.from(
      document.querySelectorAll('[data-service]'),
    ).map(el => el.getAttribute('data-service'));
    // Libraries have no SLOs, and services of other groups are left out
    expect(services).toEqual(['api', 'web', 'worker']);
    expect(screen.getByText('Not linked')).toBeInTheDocument();
  });

  it('does not fetch error budgets when no service is linked', async () => {
    const fetch = await renderCard(group('team-b'));

    expect(
      await screen.findByText(/This group owns no services/),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
