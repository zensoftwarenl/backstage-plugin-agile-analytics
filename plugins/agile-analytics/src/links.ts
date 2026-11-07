import type {
  HealthAreaId,
  Signal,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';

// Deep links into the Agile Analytics web app. The pages behind each area
// follow the web app's own overview, so a click lands where it would there.

/** Where the Agile Analytics web app is, unless `agileAnalytics.appUrl` says otherwise. */
export const DEFAULT_AGILE_ANALYTICS_APP_URL =
  'https://www.prod.agileanalytics.cloud';

// One Backstage app links to one Agile Analytics app, so the configured URL
// is kept here rather than passed to every link. See AppUrlFromConfig.
let appBaseUrl = DEFAULT_AGILE_ANALYTICS_APP_URL;

/** Sets the base URL of the Agile Analytics web app; a falsy URL resets it. */
export function setAppUrl(url: string | undefined): void {
  appBaseUrl = (url || DEFAULT_AGILE_ANALYTICS_APP_URL).replace(/\/+$/, '');
}

const AREA_PAGES: Record<HealthAreaId, string> = {
  ai: '/ai-impact',
  delivery: '/dora',
  reliability: '/error-budgets',
  flow: '/sprint-insights',
  execution: '/sprint-insights',
  investment: '/hours',
  collaboration: '/collaboration',
  kudos: '/kudos',
  pulse: '/overview#developer-experience',
};

const appUrl = (path: string) => `${appBaseUrl}${path}`;

/** The overview, for the whole organisation or a single team. */
export function overviewUrl(teamHash?: string): string {
  return appUrl(
    teamHash ? `/overview?team=${encodeURIComponent(teamHash)}` : '/overview',
  );
}

/** The actionable insights. */
export function insightsUrl(): string {
  return appUrl('/insights');
}

/** The error budgets, optionally scrolled to one service. */
export function errorBudgetsUrl(service?: string | null): string {
  return appUrl(
    service ? `/error-budgets#${service.toLowerCase()}` : '/error-budgets',
  );
}

/** Where SLOs and their error budgets are set up. */
export function errorBudgetSettingsUrl(): string {
  return appUrl('/settings/error-budgets');
}

/** The page that explains an area of the health report. */
export function areaUrl(areaId: string): string | undefined {
  const page = AREA_PAGES[areaId as HealthAreaId];
  return page ? appUrl(page) : undefined;
}

/** Where a signal leads: its ticket for stale work, else its area's page. */
export function signalUrl(signal: Signal): string | undefined {
  if (signal.kind === 'stale_work') {
    return signal.url;
  }
  if (signal.kind === 'slo_over_budget' || signal.kind === 'slo_resolved') {
    return errorBudgetsUrl(signal.service);
  }
  return signal.area ? areaUrl(signal.area) : undefined;
}
