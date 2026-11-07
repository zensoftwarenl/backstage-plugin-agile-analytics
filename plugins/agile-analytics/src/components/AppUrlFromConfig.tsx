import { configApiRef, useApi } from '@backstage/frontend-plugin-api';
import type { ReactNode } from 'react';
import { setAppUrl } from '../links';

/**
 * Points the deep links at `agileAnalytics.appUrl` before rendering its
 * children. Every page and card of the plugin is wrapped in it.
 */
export const AppUrlFromConfig = ({ children }: { children: ReactNode }) => {
  const config = useApi(configApiRef);
  setAppUrl(config.getOptionalString('agileAnalytics.appUrl'));
  return <>{children}</>;
};
