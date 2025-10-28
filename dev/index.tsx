import { createDevApp } from '@backstage/dev-utils';
import { agileAnalyticsPlugin, AgileAnalyticsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(agileAnalyticsPlugin)
  .addPage({
    element: <AgileAnalyticsPage />,
    title: 'Root Page',
    path: '/agile-analytics',
  })
  .render();
