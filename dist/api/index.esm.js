import { createApiRef } from '@backstage/core-plugin-api';
import { encodeApiKey } from '../helpers.esm.js';

const agileAnalyticsApiRef = createApiRef({
  id: "plugin.agile-analytics.service"
});
const DEFAULT_PROXY_PATH = "https://api.prod.agileanalytics.cloud";
function generateRequestParams(apiKey) {
  return {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": `${encodeApiKey(apiKey)}`,
      "Access-Control-Allow-Origin": "*"
    }
  };
}
async function generateErrorMessage(res) {
  if (res.statusText?.length) {
    return res.statusText;
  }
  const errorText = await res.text();
  if (errorText?.length) {
    return errorText;
  }
  if (res.status) {
    return res.status;
  }
  return "unknown error.";
}
class AgileAnalyticsAPIClient {
  proxyPath;
  constructor(options) {
    this.proxyPath = DEFAULT_PROXY_PATH;
  }
  async getOrganisationData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/settings/organisations/`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const { org_hash, org_name, number_of_users, status, subscription_level } = await response.json();
    const orgState = {
      orgHash: org_hash,
      orgName: org_name,
      usersNumber: number_of_users,
      status,
      subscription: subscription_level
    };
    return orgState;
  }
  async getSiData(options) {
    const limit = 50;
    let totalData = {
      featuresAmount: 0,
      notFeaturesAmount: 0,
      featuresTime: 0,
      notFeaturesTime: 0,
      tickets: []
    };
    let offset = 0;
    let response = null;
    do {
      response = await fetch(
        `${this.proxyPath}/${options.orgHash}/si/?date_start=${options.dateStart}&date_end=${options.dateEnd}&issue_key=^.*$&label=^.*$&transition_from=^.*$&transition_to=^Done$&limit=${limit}&offset=${offset}`,
        // &limit=50&offset=0 <--- add for pagination???
        generateRequestParams(options.apiKey)
      );
      if (!response.ok) {
        throw new Error(
          `There was a problem fetching analytics data: ${await generateErrorMessage(
            response
          )}`
        );
      }
      if (response.status === 200) {
        const { features, not_features, time_spent, tickets } = await response.json();
        const siState = {
          featuresAmount: features,
          notFeaturesAmount: not_features,
          featuresTime: time_spent?.feature ?? 0,
          notFeaturesTime: time_spent?.["not feature"] ?? 0,
          tickets
        };
        totalData = {
          featuresAmount: totalData.featuresAmount + siState.featuresAmount,
          notFeaturesAmount: totalData.notFeaturesAmount + siState.notFeaturesAmount,
          featuresTime: totalData.featuresTime + siState.featuresTime,
          notFeaturesTime: totalData.notFeaturesTime + siState.notFeaturesTime,
          tickets: [...totalData.tickets, ...siState.tickets]
        };
        offset += limit;
      }
    } while (response?.status !== 204);
    return totalData;
  }
  async getReposData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/swarm/selected/`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const reposState = await response.json();
    return reposState;
  }
  async getDeploymentFreqData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/dora/deployment_frequency/?date_start=${options.dateStart}&date_end=${options.dateEnd}`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getLeadTimeData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/dora/lead_time/?date_start=${options.dateStart}&date_end=${options.dateEnd}`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getStockData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/stock/branches/?date_start=${options.dateStart}&date_end=${options.dateEnd}`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getRiskChartData(options) {
    let riskDataResponce = { low: 0, medium: 0, high: 0 };
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/stock/risk/?date_start=${options.dateStart}&date_end=${options.dateEnd}`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const tableData = await response.json();
    if (tableData?.length) {
      const reposData = await Promise.allSettled(
        tableData.map(async (repo) => {
          const res = await fetch(
            `${this.proxyPath}/${options.orgHash}/stock/risk/?date_start=${options.dateStart}&date_end=${options.dateEnd}
              &direction=start&sort=branch&repository=${repo.repo_name}&start=0&end=${repo.table_rows - 1}`,
            generateRequestParams(options.apiKey)
          );
          if (!res.ok) {
            throw new Error(
              `There was a problem fetching analytics data: ${await generateErrorMessage(
                response
              )}`
            );
          }
          const data = await res.json();
          return data;
        })
      );
      if (reposData.length) {
        if (!reposData.find(
          (value) => value.status === "fulfilled" && value?.value?.length > 0
        )) ;
        riskDataResponce = reposData.filter((repo) => repo.status === "fulfilled").reduce(
          (acc, repo) => {
            if (repo?.value?.length) {
              const repoRiskData = repo?.value?.reduce(
                (riskCounter, row) => {
                  switch (row.risk) {
                    case "highest":
                    case "high":
                      return {
                        ...riskCounter,
                        high: riskCounter.high + 1
                      };
                    case "medium":
                      return {
                        ...riskCounter,
                        medium: riskCounter.medium + 1
                      };
                    case "low":
                    case "lowest":
                      return {
                        ...riskCounter,
                        low: riskCounter.low + 1
                      };
                    default:
                      return riskCounter;
                  }
                },
                {
                  low: 0,
                  medium: 0,
                  high: 0
                }
              );
              return {
                low: acc.low + repoRiskData.low,
                medium: acc.medium + repoRiskData.medium,
                high: acc.high + repoRiskData.high
              };
            }
            return acc;
          },
          { low: 0, medium: 0, high: 0 }
        );
      }
    }
    return riskDataResponce;
  }
  async getLeaksData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/security/leaks/?date_start=${options.dateStart}&date_end=${options.dateEnd}`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getServicesData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/slo/services/`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getSingleServiceData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/slo/${options.serviceName}/`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getErrorBudgetChartData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/slo/${options.serviceName}/${options.feature}/?date_start=${options.date_start}&date_end=${options.date_end}&step_size=${options.step_size}`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getTeamsData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/teams/`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getWorkspacesData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/bot/workspaces/`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getOrgUsersData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/settings/users/`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getUserPic(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.url}`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  }
  async getEmoji(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/settings/emojis/`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    const state = await response.json();
    return state;
  }
  async getTeamKudosLeaderBoard(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/teams/${options.team}/leader_board/?date_start=${options.date_start}&date_end=${options.date_end}`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    if (response?.status === 204) {
      return null;
    }
    const state = await response.json();
    return state;
  }
  async getTeamKudosSankeyData(options) {
    const response = await fetch(
      `${this.proxyPath}/${options.orgHash}/teams/${options.team}/sankey_diagram/?date_start=${options.date_start}&date_end=${options.date_end}`,
      generateRequestParams(options.apiKey)
    );
    if (!response.ok) {
      throw new Error(
        `There was a problem fetching analytics data: ${await generateErrorMessage(
          response
        )}`
      );
    }
    if (response?.status === 204) {
      return [];
    }
    const state = await response.json();
    return state;
  }
}

export { AgileAnalyticsAPIClient, agileAnalyticsApiRef };
//# sourceMappingURL=index.esm.js.map
