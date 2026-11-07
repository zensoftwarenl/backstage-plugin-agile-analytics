import type { Entity } from '@backstage/catalog-model';
import { fetchApiRef } from '@backstage/frontend-plugin-api';
import { renderInTestApp } from '@backstage/frontend-test-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { screen } from '@testing-library/react';
import { EntityDeliveryCard } from './EntityDeliveryCard';

const DAY = 86_400;
const start = 1_790_000_000;

const responses: Record<string, unknown> = {
  'dora?days=30': {
    period: { start, end: start + 30 * DAY },
    deployments: [
      ...Array.from({ length: 15 }, (_, i) => ({
        repository: 'git@gitlab.com:acme/API.git',
        production: true,
        timestamp: start + i * 2 * DAY,
      })),
      {
        repository: 'git@gitlab.com:acme/web.git',
        production: true,
        timestamp: start,
      },
    ],
    leadTimes: [
      {
        repository: 'https://gitlab.com/acme/api',
        timestamp: start + DAY,
        lead_time_for_changes: 3600,
      },
    ],
    failures: [],
  },
  collaboration: {
    as_of: '2026-10-30',
    window_start: '2025-10-30',
    people: [],
    teams: [],
    repositories: [
      {
        repository: 'acme/api',
        status: 'at_risk',
        bus_factor: 1,
        teams: [],
        owners: [
          { person_id: 1, name: 'Ann', share: 0.8, active: true },
          { person_id: 2, name: 'Bob', share: 0.2, active: false },
        ],
      },
    ],
  },
  'ai/adoption?days=30': {
    merge_requests: [
      { repository: 'acme/api', ai_assisted: true },
      { repository: 'acme/api', ai_assisted: false },
      { repository: 'acme/api', ai_assisted: null },
      { repository: 'acme/web', ai_assisted: true },
    ],
  },
};

function entityFor(annotations: Record<string, string>): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name: 'api', annotations },
  };
}

async function renderCard(entity: Entity) {
  const fetch = jest.fn(async (url: RequestInfo | URL) => {
    const path = String(url).replace('plugin://agile-analytics/', '');
    return new Response(JSON.stringify(responses[path] ?? null), {
      status: 200,
    });
  });
  await renderInTestApp(
    <EntityProvider entity={entity}>
      <EntityDeliveryCard />
    </EntityProvider>,
    { apis: [[fetchApiRef, { fetch }]] },
  );
  return fetch;
}

describe('EntityDeliveryCard', () => {
  it("shows only the entity's own repository", async () => {
    await renderCard(entityFor({ 'gitlab.com/project-slug': 'acme/api' }));

    expect(
      await screen.findByRole('group', {
        name: 'Deployment frequency: 0.5 / day',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Lead time for changes: 1 h' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Who knows it: At risk' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Bus factor 1 · Ann (80%), Bob (20%, inactive)'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'AI assisted merge requests: 50%' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1 of 2 attributed, 3 merged')).toBeInTheDocument();
  });

  it('says so when Agile Analytics does not know the repository', async () => {
    await renderCard(
      entityFor({ 'agileanalytics.cloud/repository': 'acme/x' }),
    );

    expect(
      await screen.findByText(/has no deployments, merge requests/),
    ).toBeInTheDocument();
  });

  it('does not fetch without an annotation', async () => {
    const fetch = await renderCard(entityFor({}));

    expect(screen.getByText(/project slug, to show how/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
