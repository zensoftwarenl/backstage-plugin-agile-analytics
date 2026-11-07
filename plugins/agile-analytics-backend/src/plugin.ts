import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { AgileAnalyticsClient } from './AgileAnalyticsClient';
import { DemoAgileAnalyticsClient } from './DemoAgileAnalyticsClient';
import { createRouter } from './router';

/**
 * Serves Agile Analytics data to the frontend plugin, keeping the API key
 * on the backend.
 *
 * @public
 */
export const agileAnalyticsPlugin = createBackendPlugin({
  pluginId: 'agile-analytics',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        cache: coreServices.cache,
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
      },
      async init({ config, cache, logger, httpRouter }) {
        let client;
        if (config.getOptionalBoolean('agileAnalytics.demo')) {
          logger.warn(
            'agileAnalytics.demo is on: serving made-up data, not calling Agile Analytics',
          );
          client = new DemoAgileAnalyticsClient();
        } else {
          client = AgileAnalyticsClient.fromConfig(config, { cache, logger });
        }
        // The default auth policy applies: only signed-in users and other
        // Backstage services can call these routes.
        httpRouter.use(await createRouter({ client }));
      },
    });
  },
});
