# @zensoftwarenl/backstage-plugin-agile-analytics-backend

Serves [Agile Analytics](https://www.agileanalytics.cloud) data to the
`agile-analytics` frontend plugin. The Agile Analytics API key stays on the
backend; browsers only talk to this plugin, and only signed-in users can.

## Installation

```ts
// packages/backend/src/index.ts
backend.add(import('@zensoftwarenl/backstage-plugin-agile-analytics-backend'));
```

## Configuration

```yaml
agileAnalytics:
  orgHash: ${AGILE_ANALYTICS_ORG_HASH}
  apiKey: ${AGILE_ANALYTICS_API_KEY}
  # authHeader: api-key # or bearer
  # baseUrl: https://api.prod.agileanalytics.cloud
  # cacheTtlMinutes: 15
  # demo: false # true serves made-up data and needs no orgHash or apiKey
```

See the [full documentation](https://github.com/zensoftwarenl/backstage-plugin-agile-analytics#readme)
for where to find the API key and orgHash.

## Routes

All under `/api/agile-analytics`. Only these are exposed; the plugin is not a
general proxy to the Agile Analytics API.

| Route                     | Agile Analytics endpoint                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `GET /organisation`       | `{org}/settings/organisations/`                                                    |
| `GET /health`             | `{org}/overview/`                                                                  |
| `GET /signals`            | `{org}/overview/signals/`                                                          |
| `GET /teams`              | `{org}/teams/`                                                                     |
| `GET /teams/:hash/health` | `{org}/teams/{hash}/health/`                                                       |
| `GET /slos`               | `{org}/overview/slo/`                                                              |
| `GET /slos/budgets`       | `{org}/slo/error_budgets/`, daily, with four weeks' history                        |
| `GET /dora/summary`       | `{org}/overview/dora/`                                                             |
| `GET /dora`               | `{org}/dora/deployment_frequency/[{team}]`, `lead_time/` and `failed_deployments/` |
| `GET /ai/adoption`        | `{org}/ai_impact/adoption/`, without descriptions                                  |
| `GET /ai/delivery`        | `{org}/ai_impact/delivery/`                                                        |
| `GET /ai/quality`         | `{org}/ai_impact/quality/`                                                         |
| `GET /ai/cost`            | `{org}/ai_impact/cost/` and `return/`                                              |
| `GET /reviews`            | `{org}/review/summary/[{team}]`                                                    |
| `GET /collaboration`      | `{org}/collaboration/`, without the person to person graph                         |
| `GET /kudos`              | `{org}/kudos/[teams/{team}/]leaderboard/` and `sankey_diagram/`, as counts only    |
| `GET /sprints`            | `{org}/overview/sprints/`                                                          |
| `GET /hours`              | `{org}/overview/hours-investment/`                                                 |
| `GET /trends`             | `{org}/ai_impact/dora_over_time/`                                                  |

Routes over a period take `days` (7, 14, 30 or 90; default 14). The period
ends at the start of the next UTC day, so a query, and its cache entry, stays
the same all day. `team` takes a team hash where Agile Analytics can narrow
the data to a team. `/collaboration` takes `windowDays` (365, 730 or 1095;
default 730). `/trends` takes `days` (91, 182 or 364; default 91) and an
optional `node`, a group or repository path such as `group/project`. Where Agile Analytics has no data yet (HTTP 204) the routes
answer `null`, or an empty list for lists.

## Development

`yarn start` in this folder runs the plugin in a standalone backend with auth
mocked out, so you can `curl http://localhost:7007/api/agile-analytics/health`.
