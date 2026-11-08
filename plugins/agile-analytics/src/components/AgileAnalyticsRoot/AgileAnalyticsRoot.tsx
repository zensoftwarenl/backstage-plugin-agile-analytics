import {
  Route,
  Routes,
  useLocation,
  useResolvedPath,
  useSearchParams,
} from 'react-router-dom';
import { ButtonLink, Flex, PluginHeader } from '@backstage/ui';
import {
  areaUrl,
  errorBudgetSettingsUrl,
  errorBudgetsUrl,
  insightsUrl,
  overviewUrl,
} from '../../links';
import { AiPage } from '../AiPage';
import { CollaborationPage } from '../CollaborationPage';
import { DoraPage } from '../DoraPage';
import { ErrorBudgetsPage } from '../ErrorBudgetsPage';
import { KudosPage } from '../KudosPage';
import { OverviewPage } from '../OverviewPage';
import { SprintsPage } from '../SprintsPage';
import { TrendsPage } from '../TrendsPage';

type ExternalLink = { href: string; label: string };

type Tab = {
  id: string;
  label: string;
  element: JSX.Element;
  links: (team?: string) => ExternalLink[];
};

const openInAgileAnalytics = (href: string) => ({
  href,
  label: 'Open in Agile Analytics',
});

/** The tabs, each under its own path below the plugin. */
const TABS: Tab[] = [
  {
    id: '',
    label: 'Overview',
    element: <OverviewPage />,
    links: team => [
      { href: insightsUrl(), label: 'Insights' },
      openInAgileAnalytics(overviewUrl(team)),
    ],
  },
  {
    id: 'dora',
    label: 'DORA',
    element: <DoraPage />,
    links: () => [openInAgileAnalytics(areaUrl('delivery')!)],
  },
  {
    id: 'error-budgets',
    label: 'Error budgets',
    element: <ErrorBudgetsPage />,
    links: () => [
      { href: errorBudgetSettingsUrl(), label: 'Manage SLOs' },
      openInAgileAnalytics(errorBudgetsUrl()),
    ],
  },
  {
    id: 'ai',
    label: 'AI adoption',
    element: <AiPage />,
    links: () => [openInAgileAnalytics(areaUrl('ai')!)],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    element: <CollaborationPage />,
    links: () => [openInAgileAnalytics(areaUrl('collaboration')!)],
  },
  {
    id: 'kudos',
    label: 'Kudos',
    element: <KudosPage />,
    links: () => [openInAgileAnalytics(areaUrl('kudos')!)],
  },
  {
    id: 'sprints',
    label: 'Sprints & hours',
    element: <SprintsPage />,
    links: () => [
      openInAgileAnalytics(areaUrl('flow')!),
      { href: areaUrl('investment')!, label: 'Hours' },
    ],
  },
  {
    id: 'trends',
    label: 'Trends',
    element: <TrendsPage />,
    links: () => [openInAgileAnalytics(areaUrl('ai')!)],
  },
];

const ExternalButton = ({ href, label }: ExternalLink) => (
  <ButtonLink
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    variant="secondary"
    size="small"
  >
    {label}
  </ButtonLink>
);

/** The Agile Analytics page: a header with a tab per area. */
export const AgileAnalyticsRoot = () => {
  // Wherever the app mounts the plugin
  const base = useResolvedPath('').pathname.replace(/\/+$/, '');
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();
  const team = searchParams.get('team') ?? undefined;
  const current =
    TABS.find(tab => tab.id && pathname.startsWith(`${base}/${tab.id}`)) ??
    TABS[0];

  return (
    <>
      <PluginHeader
        title="Agile Analytics"
        tabs={TABS.map(tab => ({
          id: tab.id || 'overview',
          label: tab.label,
          // The team and period stay when switching tabs
          href: `${tab.id ? `${base}/${tab.id}` : base || '/'}${search}`,
        }))}
        customActions={
          <Flex gap="2">
            {current.links(team).map(link => (
              <ExternalButton key={link.label} {...link} />
            ))}
          </Flex>
        }
      />
      <Routes>
        {TABS.map(tab => (
          <Route key={tab.id} path={`/${tab.id}`} element={tab.element} />
        ))}
      </Routes>
    </>
  );
};
