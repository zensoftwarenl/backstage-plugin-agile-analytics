import { fetchApiRef, useApi } from '@backstage/frontend-plugin-api';
import { ResponseError } from '@backstage/errors';
import useAsync from 'react-use/esm/useAsync';

/**
 * Reads from the agile-analytics backend plugin, which holds the Agile
 * Analytics API key. `path` is relative to the plugin, e.g. `health`.
 */
export function useAgileAnalytics<T>(path: string | undefined) {
  const { fetch } = useApi(fetchApiRef);

  return useAsync(async (): Promise<T | undefined> => {
    if (!path) return undefined;
    const response = await fetch(`plugin://agile-analytics/${path}`);
    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }
    return response.json();
  }, [fetch, path]);
}
