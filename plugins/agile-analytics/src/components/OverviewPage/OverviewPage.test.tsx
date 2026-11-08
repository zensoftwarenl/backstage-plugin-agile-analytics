import { fetchApiRef } from '@backstage/frontend-plugin-api';
import { renderInTestApp } from '@backstage/frontend-test-utils';
import { screen } from '@testing-library/react';
import { OverviewPage } from './OverviewPage';

const responses: Record<string, unknown> = {
  'plugin://agile-analytics/organisation': {
    org_hash: 'ORG1',
    org_name: 'Acme Robotics',
  },
  'plugin://agile-analytics/teams': [
    { team_hash: 't1', team_name: 'Platform' },
  ],
  'plugin://agile-analytics/health': {
    metrics: [
      { id: 'delivery', score: 82, status: 1, trend: 3 },
      { id: 'reliability', score: 45, status: -1 },
      { id: 'ai', score: 0, available: false },
    ],
  },
  'plugin://agile-analytics/signals': [
    { kind: 'slo_over_budget', service: 'api', slo: 'Availability' },
  ],
};

function renderPage(fetch: typeof window.fetch) {
  return renderInTestApp(<OverviewPage />, {
    apis: [[fetchApiRef, { fetch }]],
  });
}

describe('OverviewPage', () => {
  it('shows the health report and signals from the backend', async () => {
    await renderPage(
      async url =>
        new Response(JSON.stringify(responses[String(url)]), { status: 200 }),
    );

    expect(
      await screen.findByLabelText(/^Engineering health score 64 out of 100/),
    ).toBeInTheDocument();
    expect(screen.getByText('1 of 2 areas need attention')).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();
    expect(screen.getByText('Action needed')).toBeInTheDocument();
    expect(screen.getByText('+3 pt')).toBeInTheDocument();
    expect(
      screen.getByText('api · Availability is over its error budget'),
    ).toBeInTheDocument();
  });

  it('links into the Agile Analytics web app', async () => {
    await renderPage(
      async url =>
        new Response(JSON.stringify(responses[String(url)]), { status: 200 }),
    );

    expect(
      await screen.findByRole('link', { name: 'Delivery' }),
    ).toHaveAttribute('href', 'https://www.prod.agileanalytics.cloud/dora');
    expect(
      screen.getByRole('link', { name: 'Engineering health' }),
    ).toHaveAttribute('href', 'https://www.prod.agileanalytics.cloud/overview');
    expect(
      screen.getByRole('link', {
        name: 'api · Availability is over its error budget',
      }),
    ).toHaveAttribute(
      'href',
      'https://www.prod.agileanalytics.cloud/error-budgets#api',
    );
  });

  it('explains when the backend cannot reach Agile Analytics', async () => {
    await renderPage(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              name: 'ServiceUnavailableError',
              message: 'Agile Analytics rejected the API key',
            },
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        ),
    );

    expect(
      await screen.findByText('Could not load the health report'),
    ).toBeInTheDocument();
  });
});
