import type { Entity } from '@backstage/catalog-model';
import { fetchApiRef } from '@backstage/frontend-plugin-api';
import { renderInTestApp } from '@backstage/frontend-test-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { screen } from '@testing-library/react';
import { EntityErrorBudgetCard } from './EntityErrorBudgetCard';

const slos = {
  metrics: [
    {
      id: 1,
      sloName: 'Availability',
      service: 'API',
      sloValue: 99.2,
      sloTarget: 0.995,
      errorBudget: -12,
    },
    {
      id: 2,
      sloName: 'Latency',
      service: 'api',
      sloValue: 99.9,
      sloTarget: 0.99,
      errorBudget: 80,
    },
    {
      id: 3,
      sloName: 'Availability',
      service: 'web',
      sloValue: 99.99,
      sloTarget: 0.999,
      errorBudget: 90,
    },
  ],
};

function entityFor(service?: string): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'api',
      annotations: service ? { 'agileanalytics.cloud/service': service } : {},
    },
  };
}

async function renderCard(entity: Entity) {
  const fetch = jest.fn(
    async () => new Response(JSON.stringify(slos), { status: 200 }),
  );
  await renderInTestApp(
    <EntityProvider entity={entity}>
      <EntityErrorBudgetCard />
    </EntityProvider>,
    { apis: [[fetchApiRef, { fetch }]] },
  );
  return fetch;
}

describe('EntityErrorBudgetCard', () => {
  it("shows only the entity's own service, lowest budget first", async () => {
    await renderCard(entityFor('api'));

    expect(await screen.findByText('1 of 2 over budget')).toBeInTheDocument();
    const names = screen
      .getAllByText(/^(Availability|Latency)$/)
      .map(el => el.textContent);
    expect(names).toEqual(['Availability', 'Latency']);
    expect(
      screen.getByRole('link', { name: 'Open in Agile Analytics' }),
    ).toHaveAttribute(
      'href',
      'https://www.prod.agileanalytics.cloud/error-budgets#api',
    );
  });

  it('says so when the service has no SLOs yet', async () => {
    await renderCard(entityFor('billing'));

    expect(await screen.findByText(/has no SLOs for/)).toBeInTheDocument();
  });

  it('does not fetch without the annotation', async () => {
    const fetch = await renderCard(entityFor());

    expect(
      screen.getByText(/annotation to show this service/),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
