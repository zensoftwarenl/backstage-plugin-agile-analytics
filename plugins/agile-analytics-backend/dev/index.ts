import { createBackend } from '@backstage/backend-defaults';
import { mockServices } from '@backstage/backend-test-utils';

// Standalone backend for working on the plugin. It reads agileAnalytics.*
// from the app-config files, so set AGILE_ANALYTICS_ORG_HASH and
// AGILE_ANALYTICS_API_KEY, then try:
//
//   curl http://localhost:7007/api/agile-analytics/health

const backend = createBackend();

// Skip real auth so the routes can be called with curl
backend.add(mockServices.auth.factory());
backend.add(mockServices.httpAuth.factory());

backend.add(import('../src'));

backend.start();
