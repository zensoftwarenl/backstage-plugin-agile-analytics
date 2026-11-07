import {
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';

import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';
import {
  isAgileAnalyticsRepositoryAvailable,
  isAgileAnalyticsServiceAvailable,
} from './entity';
import { rootRouteRef } from './routes';
import { AppUrlFromConfig } from './components/AppUrlFromConfig';

export const page = PageBlueprint.make({
  params: {
    path: '/agile-analytics',
    title: 'Agile Analytics',
    routeRef: rootRouteRef,
    noHeader: true,
    loader: () =>
      import('./components/AgileAnalyticsRoot').then(m => (
        <AppUrlFromConfig>
          <m.AgileAnalyticsRoot />
        </AppUrlFromConfig>
      )),
  },
});

export const errorBudgetCard = EntityCardBlueprint.make({
  name: 'error-budget',
  params: {
    filter: isAgileAnalyticsServiceAvailable,
    loader: () =>
      import('./components/EntityErrorBudgetCard').then(m => (
        <AppUrlFromConfig>
          <m.EntityErrorBudgetCard />
        </AppUrlFromConfig>
      )),
  },
});

export const teamErrorBudgetsCard = EntityCardBlueprint.make({
  name: 'team-error-budgets',
  params: {
    filter: 'kind:group',
    loader: () =>
      import('./components/EntityTeamErrorBudgetsCard').then(m => (
        <AppUrlFromConfig>
          <m.EntityTeamErrorBudgetsCard />
        </AppUrlFromConfig>
      )),
  },
});

export const deliveryCard = EntityCardBlueprint.make({
  name: 'delivery',
  params: {
    filter: isAgileAnalyticsRepositoryAvailable,
    loader: () =>
      import('./components/EntityDeliveryCard').then(m => (
        <AppUrlFromConfig>
          <m.EntityDeliveryCard />
        </AppUrlFromConfig>
      )),
  },
});

/**
 * Agile Analytics plugin for the new frontend system.
 *
 * @public
 */
export const agileAnalyticsPlugin = createFrontendPlugin({
  pluginId: 'agile-analytics',
  extensions: [page, errorBudgetCard, teamErrorBudgetsCard, deliveryCard],
  routes: {
    root: rootRouteRef,
  },
});
