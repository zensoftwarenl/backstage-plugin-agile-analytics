# @zensoftwarenl/backstage-plugin-agile-analytics

## 2.0.0

### Major Changes

- Rewritten from ZEN Software's own Backstage plugins, as three packages: the
  frontend plugin, a new backend plugin and shared types. The Agile Analytics
  API key and orgHash are now read by the backend only and never reach the
  browser.
- Supports Backstage 1.56+ on the new frontend and backend systems only. The
  legacy frontend system is no longer supported.
- New: engineering health overview, DORA, error budgets, AI adoption,
  collaboration, sprints & hours and trends tabs; error budget, team error
  budgets and delivery entity cards; demo mode (`agileAnalytics.demo`).
- Removed: the 0.2 pages built on Highcharts, the kudos page and the stock
  pages.
