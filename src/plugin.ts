import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { AgileAnalyticsAPIClient, agileAnalyticsApiRef } from './api';

export const agileAnalyticsPlugin = createPlugin({
  id: 'agile-analytics',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: agileAnalyticsApiRef,
      deps: { discoveryApi: discoveryApiRef },
      factory: ({ discoveryApi }) =>
        new AgileAnalyticsAPIClient({ discoveryApi }),
    }),
  ],
});

export const AgileAnalyticsPage = agileAnalyticsPlugin.provide(
  createRoutableExtension({
    name: 'Agile Analytics Plugin Page',
    component: () =>
      import('./components/AaMainPageComponent').then(m => m.AaMainPageComponent),
    mountPoint: rootRouteRef,
  }),
);
