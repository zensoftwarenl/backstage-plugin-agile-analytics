import { createPlugin, createApiFactory, discoveryApiRef, createRoutableExtension } from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes.esm.js';
import { AgileAnalyticsAPIClient, agileAnalyticsApiRef } from './api/index.esm.js';

const agileAnalyticsPlugin = createPlugin({
  id: "agile-analytics",
  routes: {
    root: rootRouteRef
  },
  apis: [
    createApiFactory({
      api: agileAnalyticsApiRef,
      deps: { discoveryApi: discoveryApiRef },
      factory: ({ discoveryApi }) => new AgileAnalyticsAPIClient({ discoveryApi })
    })
  ]
});
const AgileAnalyticsPage = agileAnalyticsPlugin.provide(
  createRoutableExtension({
    name: "Agile Analytics Plugin Page",
    component: () => import('./components/AaMainPageComponent/index.esm.js').then((m) => m.AaMainPageComponent),
    mountPoint: rootRouteRef
  })
);

export { AgileAnalyticsPage, agileAnalyticsPlugin };
//# sourceMappingURL=plugin.esm.js.map
