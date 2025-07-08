import { createApiRef, createRouteRef, createPlugin, createApiFactory, discoveryApiRef, createRoutableExtension } from '@backstage/core-plugin-api';
import moment from 'moment';

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".deployment-plotline-tooltip {\r\n  overflow: visible;\r\n  position: relative;\r\n  padding: 8px;\r\n  width: 16px;\r\n  height: 16px;\r\n  border-radius: 1000%;\r\n  background-color: white;\r\n  display: flex;\r\n  justify-content: center;\r\n  align-items: center;\r\n  border: 1px solid gray;\r\n  color: gray;\r\n  font-size: 10px;\r\n}\r\n\r\n.deployment-plotline-tooltip:hover {\r\n  border-color: #000000de;\r\n  color: #000000de;\r\n}\r\n\r\n.basic-transition {\r\n  transform: translateZ(0); /* triggers GPU acceleration, optional but common */\r\n  transition-property: all;\r\n  transition-duration: 200ms;\r\n  transition-timing-function: ease-in;\r\n}\r\n.highcharts-plot-line-label,\r\n.highcharts-root,\r\n.highcharts-container {\r\n  overflow: visible !important;\r\n  overflow-x: visible !important;\r\n  overflow-y: visible !important;\r\n}\r\n\r\n.highcharts-plot-line-label .label-tooltip-container .label-tooltip {\r\n  width: 280px;\r\n  overflow: hidden;\r\n  border: 0px solid #cccccc;\r\n  box-sizing: border-box;\r\n  transform: translate(0, 100%);\r\n}\r\n\r\n.highcharts-plot-line-label:hover .label-tooltip-container .label-tooltip {\r\n  width: 280px;\r\n  border: 1px solid #cccccc;\r\n  box-sizing: border-box;\r\n  transform: translate(0, 0);\r\n}\r\n\r\n.highcharts-plot-line-label .label-tooltip-container {\r\n  width: 0;\r\n}\r\n\r\n.highcharts-plot-line-label:hover .label-tooltip-container {\r\n  width: 280px;\r\n}\r\n\r\n.label-tooltip-container {\r\n  position: absolute;\r\n  top: -76px;\r\n  overflow: hidden;\r\n  z-index: -50;\r\n}\r\n\r\n.label-tooltip-container-left {\r\n  left: -8px;\r\n}\r\n.label-tooltip-container-right {\r\n  right: -8px;\r\n}\r\n\r\n.label-tooltip {\r\n  background-color: white;\r\n  cursor: default;\r\n  color: #000000de;\r\n  display: flex;\r\n  flex-direction: column;\r\n  justify-content: start;\r\n  font-size: 12px;\r\n  height: 74px;\r\n  overflow: hidden;\r\n}\r\n\r\n.label-tooltip-text-first {\r\n  padding-top: 4px;\r\n}\r\n\r\n.label-tooltip-text {\r\n  background-color: white;\r\n  flex-shrink: 0;\r\n  height: 16px;\r\n  margin: 0;\r\n  padding: 0px 4px;\r\n  overflow: hidden;\r\n  overflow-wrap: break-word;\r\n  word-break: break-word;\r\n  white-space: normal;\r\n  background-color: transparent;\r\n}\r\n\r\n.font-bold {\r\n  font-weight: 700;\r\n}\r\n\r\n.text-green {\r\n  color: rgb(142, 195, 88);\r\n}\r\n\r\n.text-red {\r\n  color: rgb(192, 58, 58);\r\n}\r\n\r\n.full-height {\r\n  height: 100%;\r\n}\r\n\r\n.rank {\r\n  display: flex;\r\n  justify-content: space-between;\r\n  align-items: baseline;\r\n  margin-bottom: 6px;\r\n  margin-right: 14px;\r\n}\r\n\r\n.rank-1 {\r\n  color: #95c762;\r\n}\r\n\r\n.rank-2 {\r\n  color: #75a742;\r\n}\r\n.rank-3 {\r\n  color: rgb(192, 58, 58);\r\n}\r\n\r\n.userpic-kudos {\r\n  position: absolute;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n.gap-12 {\r\n  gap: 12px\r\n}\r\n.gap-8 {\r\n  gap: 8px\r\n}\r\n.gap-32 {\r\n  gap: 32px\r\n}\r\n\r\n.content-container {\r\n  overflow-x: hidden;\r\n}\r\n";
styleInject(css_248z);

function encodeApiKey(key) {
  const encoded = Buffer.from(`${key}`).toString("base64");
  return encoded;
}
function getStartDate(amount, period) {
  return moment().set({ hours: 0, minutes: 0, seconds: 0 }).subtract(amount, period).unix();
}
function getEndDate() {
  return moment().set({ hours: 23, minutes: 59, seconds: 59 }).unix();
}
function getUniqueListByParent(arr) {
  const uniqueListOfLatest = arr.reduce((acc, item) => {
    const isInList = acc.find((ticket) => ticket.parent.key === item.parent.key);
    if (isInList) {
      const isLater = item.timestamp >= isInList.timestamp;
      if (isLater) {
        return acc.map((task) => {
          if (task.parent.key === item.parent.key) {
            return item;
          }
          return task;
        });
      }
      return acc;
    }
    return [...acc, item];
  }, []);
  return uniqueListOfLatest;
}
function capitalizeFirstLetter(string) {
  if (!string) {
    return string;
  }
  const capitalized = string[0].toUpperCase() + string.substring(1).toLowerCase();
  return capitalized;
}
function generateEventsChartOptionsBase(setZoomTimeperiod, eventsVisibility, setEventsVisibility, step) {
  return {
    colors: ["#FF6384", "#8ec358"],
    chart: {
      type: "column",
      height: 220,
      zooming: {
        type: "x",
        resetButton: {
          position: { x: 0, y: -50 },
          theme: {
            display: "none"
          }
        }
      },
      events: {
        selection: function(event) {
          var _a, _b;
          if (event.xAxis) {
            const selectedMin = (_a = event.xAxis[0]) == null ? void 0 : _a.min;
            const selectedMax = (_b = event.xAxis[0]) == null ? void 0 : _b.max;
            setZoomTimeperiod([selectedMin, selectedMax]);
          } else {
            setZoomTimeperiod(null);
          }
          return false;
        },
        render: function() {
          var _a;
          (_a = this == null ? void 0 : this.resetZoomButton) == null ? void 0 : _a.hide();
        }
      }
    },
    title: {
      text: ""
    },
    yAxis: {
      labels: {
        format: "{value}"
      },
      title: {
        enabled: false
      },
      min: 0
    },
    xAxis: {
      crosshair: true,
      type: "datetime",
      labels: {
        format: "{value:%d %b %H:%M}",
        rotation: -50,
        align: "right"
      }
    },
    credits: {
      enabled: false
    },
    plotOptions: {
      series: {
        stacking: "normal",
        minPointLength: 2,
        events: {
          legendItemClick: function() {
            setEventsVisibility((prevState) => {
              var _a, _b, _c, _d, _e;
              if (eventsVisibility) {
                return {
                  ...prevState,
                  [(_a = this == null ? void 0 : this.userOptions) == null ? void 0 : _a.title]: {
                    ...prevState[(_b = this == null ? void 0 : this.userOptions) == null ? void 0 : _b.title],
                    [(_c = this == null ? void 0 : this.userOptions) == null ? void 0 : _c.name]: !prevState[(_d = this == null ? void 0 : this.userOptions) == null ? void 0 : _d.title][(_e = this == null ? void 0 : this.userOptions) == null ? void 0 : _e.name]
                  }
                };
              }
              return null;
            });
          }
        }
      }
    },
    tooltip: {
      formatter: function() {
        return this.points.reduce(function(s, point) {
          return (point == null ? void 0 : point.series.name) + " in the last " + step + ": <b>" + (point == null ? void 0 : point.y) + "</b><br/>" + s;
        }, this.points.length > 1 ? "Total: <b>" + this.points[0].total + "</b>" : "");
      },
      shared: true
    },
    legend: {
      labelFormatter: function() {
        var _a, _b;
        return this.userOptions.title ? `<span><b>${this.userOptions.title + ":"} ${(_a = this.userOptions.name) != null ? _a : ""}</b></span><br>` : `<b>${(_b = this.userOptions.name) != null ? _b : ""}</b>`;
      }
    }
  };
}
const ERROR_BUDGET_CHART_COLORS = [
  "#7902D7",
  "#F8C238",
  "#15A2BB",
  "#81BC42",
  "#D6DA33",
  "#484A53"
];
function generateErrorBudgetChartOptionsBase(dataFeaturesVisibility, setDataFeaturesVisibility, setZoomTimeperiod, isInTeam, step) {
  return {
    colors: ERROR_BUDGET_CHART_COLORS,
    chart: {
      type: "line",
      height: 460,
      zooming: {
        type: "x"
      },
      spacingTop: 40,
      events: {
        selection: function(event) {
          var _a, _b;
          if (event.xAxis) {
            const selectedMin = (_a = event.xAxis[0]) == null ? void 0 : _a.min;
            const selectedMax = (_b = event.xAxis[0]) == null ? void 0 : _b.max;
            setZoomTimeperiod([selectedMin, selectedMax]);
          } else {
            setZoomTimeperiod(null);
          }
        },
        render: function() {
          var _a;
          (_a = this == null ? void 0 : this.resetZoomButton) == null ? void 0 : _a.hide();
          const chartContainer = this.container.parentNode;
          chartContainer.style.overflow = "visible";
        }
      }
    },
    title: {
      text: ""
    },
    yAxis: {
      max: 100,
      ceiling: 100,
      alignTicks: false,
      endOnTick: false,
      labels: {
        format: "{value}%"
      },
      title: {
        enabled: false
      },
      plotBands: [
        {
          color: "#f4f9ee",
          from: 0,
          to: 1e10
        },
        {
          color: "#f9ebeb",
          from: -1e10,
          to: 0
        }
      ],
      tickPositioner: function() {
        const tickPositions = this.tickPositions;
        const lastTick = tickPositions[tickPositions.length - 1];
        const max = this.options.max;
        if (lastTick > max) {
          tickPositions.pop();
          tickPositions.push(max);
        }
      }
    },
    xAxis: {
      crosshair: true,
      type: "datetime",
      labels: {
        format: "{value:%d %b %H:%M}",
        rotation: -50,
        align: "right"
      }
    },
    credits: {
      enabled: false
    },
    plotOptions: {
      series: {
        opacity: 0.6,
        marker: {
          enabled: false
        },
        events: {
          legendItemClick: function() {
            var _a, _b, _c, _d, _e, _f;
            const name = ((_a = this == null ? void 0 : this.userOptions) == null ? void 0 : _a.slo_name) ? ((_b = this == null ? void 0 : this.userOptions) == null ? void 0 : _b.service) ? ((_c = this == null ? void 0 : this.userOptions) == null ? void 0 : _c.slo_name) + " " + ((_d = this == null ? void 0 : this.userOptions) == null ? void 0 : _d.service) : (_e = this == null ? void 0 : this.userOptions) == null ? void 0 : _e.slo_name : (_f = this == null ? void 0 : this.userOptions) == null ? void 0 : _f.title;
            setDataFeaturesVisibility((prevState) => {
              return {
                ...prevState,
                [name]: !dataFeaturesVisibility[name]
              };
            });
          }
        }
      }
    },
    tooltip: {
      shared: true,
      positioner: function(labelWidth, labelHeight, point) {
        const tooltipX = point.plotX < 250 ? point.plotX + 70 : point.plotX - this.label.width + 40;
        const tooltipY = ((point == null ? void 0 : point.plotY) ? point == null ? void 0 : point.plotY : 0) + this.label.height;
        return {
          x: tooltipX,
          y: tooltipY
        };
      },
      formatter: function() {
        return this.points.reduce(function(s, point) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
          return s + `<br/><span style="color:${point.color}">${((_b = (_a = point == null ? void 0 : point.series) == null ? void 0 : _a.userOptions) == null ? void 0 : _b.slo_name) ? isInTeam ? ((_d = (_c = point == null ? void 0 : point.series) == null ? void 0 : _c.userOptions) == null ? void 0 : _d.slo_name) + "/" + ((_f = (_e = point == null ? void 0 : point.series) == null ? void 0 : _e.userOptions) == null ? void 0 : _f.service) : (_h = (_g = point == null ? void 0 : point.series) == null ? void 0 : _g.userOptions) == null ? void 0 : _h.slo_name : (_j = (_i = point == null ? void 0 : point.series) == null ? void 0 : _i.userOptions) == null ? void 0 : _j.title}</span>${isInTeam ? "" : " last " + step}: ` + (+point.y.toFixed(3) === 100 ? 100 : point.y.toFixed(3)) + "%";
        }, moment(this.x).format("dddd, MMM D, HH:mm:ss"));
      }
    },
    legend: {
      labelFormatter: function() {
        var _a, _b, _c, _d;
        return this.userOptions.slo_name ? `<b>SLO: </b><span>${(_a = this.userOptions.slo_name) != null ? _a : ""}</span><br>
              <b>${capitalizeFirstLetter(isInTeam ? "service" : "description")}: </b><span>${isInTeam ? this.userOptions.service : (_b = this.userOptions.slo_description) != null ? _b : ""}</span><br> 

              <b>SLO target: </b><span>${(_c = this.userOptions.slo_target) != null ? _c : ""}</span><br>` : `<b>${(_d = this.userOptions.title) != null ? _d : ""}</b>`;
      }
    }
  };
}
function formatDuration(milliseconds) {
  const duration = moment.duration(milliseconds);
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const hoursText = hours === 1 ? "hour" : "hours";
  const minutesTest = minutes === 1 ? "minute" : "minutes";
  const hourStr = hours > 0 ? `${hours} ${hoursText}` : "";
  const minuteStr = minutes > 0 ? `${minutes} ${minutesTest}` : "";
  if (!hourStr && !minuteStr) {
    return "0 minutes";
  }
  return [hourStr, minuteStr].filter(Boolean).join(" ");
}
function formatPlotLinesTooltip(item, start, end, groupRangeString) {
  var _a, _b, _c, _d;
  return `<div class="deployment-plotline-tooltip basic-transition">${((_a = item == null ? void 0 : item.deployments) == null ? void 0 : _a.length) ? ((_b = item == null ? void 0 : item.deployments) == null ? void 0 : _b.length) > 9 ? "9+" : (_c = item == null ? void 0 : item.deployments) == null ? void 0 : _c.length : "1"}<div class="${(item == null ? void 0 : item.timestamp) * 1e3 - start - (end - start) / 2.5 < 0 ? "label-tooltip-container-left" : "label-tooltip-container-right"} label-tooltip-container"><div class="label-tooltip basic-transition"><p class='label-tooltip-text label-tooltip-text-first'><b>Deployment date:</b> ${moment.unix(item == null ? void 0 : item.timestamp).format("HH:mm:ss D.M.YY")}</p><p class=' label-tooltip-text'><b>Project:</b> ${item == null ? void 0 : item.repository}</p><p class='label-tooltip-text  font-bold'>Status: <span class='${(item == null ? void 0 : item.status) === "success" ? "text-green" : "text-red"}'>${item == null ? void 0 : item.status}</span></p>
                                ${(item == null ? void 0 : item.type) === "group" ? `<p class="label-tooltip-text">
                                     <b>
                                         ...and ${((_d = item == null ? void 0 : item.deployments) == null ? void 0 : _d.length) - 1}
                                         more
                                     </b>
                                     in the next ${groupRangeString}
                                 </p>` : ""}</p></div></div></div>`;
}
function setDeployments(list, dep) {
  var _a, _b, _c;
  if (list == null ? void 0 : list.length) {
    if ((_b = (_a = list[(list == null ? void 0 : list.length) - 1]) == null ? void 0 : _a.deployments) == null ? void 0 : _b.length) {
      return [...(_c = list[(list == null ? void 0 : list.length) - 1]) == null ? void 0 : _c.deployments, dep];
    }
    return [list[(list == null ? void 0 : list.length) - 1], dep];
  }
  return [];
}
function formatPlotLines(deployments, start, end) {
  const groupRange = +((+end.toFixed(0) - +start.toFixed(0)) / 60).toFixed(0);
  const groupRangeString = formatDuration(groupRange);
  const groupedDeployments = deployments == null ? void 0 : deployments.reduce((acc, dep) => {
    var _a;
    if ((dep == null ? void 0 : dep.timestamp) * 1e3 < start || (dep == null ? void 0 : dep.timestamp) * 1e3 > end) {
      return acc;
    }
    if (!(acc == null ? void 0 : acc.length) || (dep == null ? void 0 : dep.timestamp) * 1e3 - ((_a = acc[(acc == null ? void 0 : acc.length) - 1]) == null ? void 0 : _a.timestamp) * 1e3 > groupRange) {
      return [...acc, dep];
    }
    const copiedAcc = acc;
    return [
      ...copiedAcc.slice(0, (copiedAcc == null ? void 0 : copiedAcc.length) - 1),
      {
        ...acc[(acc == null ? void 0 : acc.length) - 1],
        type: "group",
        deployments: setDeployments(copiedAcc, dep)
      }
    ];
  }, []);
  const formattedList = (groupedDeployments == null ? void 0 : groupedDeployments.length) ? groupedDeployments.map((item) => {
    return {
      value: (item == null ? void 0 : item.timestamp) * 1e3,
      color: "#666666",
      width: 1,
      dashStyle: "LongDash",
      zIndex: 2,
      label: {
        useHTML: true,
        formatter: function() {
          return formatPlotLinesTooltip(item, start, end, groupRangeString);
        },
        y: -15,
        x: -1,
        align: "center",
        rotation: 0,
        style: {
          fontSize: 14,
          overflow: "visible"
        }
      }
    };
  }) : null;
  return formattedList;
}
function filterDataEvents(fullData, min, max) {
  const filtered = fullData == null ? void 0 : fullData.map((dataset) => {
    var _a;
    const updatedData = (_a = dataset == null ? void 0 : dataset.data) == null ? void 0 : _a.filter((item) => {
      if ((item == null ? void 0 : item.length) && item[0] >= min && item[0] <= max) {
        return item;
      }
      return null;
    });
    return { ...dataset, data: [...updatedData] };
  });
  return filtered;
}

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
  var _a;
  if ((_a = res.statusText) == null ? void 0 : _a.length) {
    return res.statusText;
  }
  const errorText = await res.text();
  if (errorText == null ? void 0 : errorText.length) {
    return errorText;
  }
  if (res.status) {
    return res.status;
  }
  return "unknown error.";
}
class AgileAnalyticsAPIClient {
  constructor(options) {
    this.proxyPath = DEFAULT_PROXY_PATH;
  }
  async getOrganisationData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/settings/organisations/`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
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
    var _a, _b;
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
      response = await fetch(`${this.proxyPath}/${options.orgHash}/si/?date_start=${options.dateStart}&date_end=${options.dateEnd}&issue_key=^.*$&label=^.*$&transition_from=^.*$&transition_to=^Done$&limit=${limit}&offset=${offset}`, generateRequestParams(options.apiKey));
      if (!response.ok) {
        throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
      }
      if (response.status === 200) {
        const { features, not_features, time_spent, tickets } = await response.json();
        const siState = {
          featuresAmount: features,
          notFeaturesAmount: not_features,
          featuresTime: (_a = time_spent == null ? void 0 : time_spent.feature) != null ? _a : 0,
          notFeaturesTime: (_b = time_spent == null ? void 0 : time_spent["not feature"]) != null ? _b : 0,
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
    } while ((response == null ? void 0 : response.status) !== 204);
    return totalData;
  }
  async getReposData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/swarm/selected/`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const reposState = await response.json();
    return reposState;
  }
  async getDeploymentFreqData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/dora/deployment_frequency/?date_start=${options.dateStart}&date_end=${options.dateEnd}`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getLeadTimeData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/dora/lead_time/?date_start=${options.dateStart}&date_end=${options.dateEnd}`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getStockData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/stock/branches/?date_start=${options.dateStart}&date_end=${options.dateEnd}`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getRiskChartData(options) {
    let riskDataResponce = { low: 0, medium: 0, high: 0 };
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/stock/risk/?date_start=${options.dateStart}&date_end=${options.dateEnd}`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const tableData = await response.json();
    if (tableData == null ? void 0 : tableData.length) {
      const reposData = await Promise.allSettled(tableData.map(async (repo) => {
        const res = await fetch(`${this.proxyPath}/${options.orgHash}/stock/risk/?date_start=${options.dateStart}&date_end=${options.dateEnd}
              &direction=start&sort=branch&repository=${repo.repo_name}&start=0&end=${repo.table_rows - 1}`, generateRequestParams(options.apiKey));
        if (!res.ok) {
          throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
        }
        const data = await res.json();
        return data;
      }));
      if (reposData.length) {
        if (!reposData.find((value) => {
          var _a;
          return value.status === "fulfilled" && ((_a = value == null ? void 0 : value.value) == null ? void 0 : _a.length) > 0;
        })) ;
        riskDataResponce = reposData.filter((repo) => repo.status === "fulfilled").reduce((acc, repo) => {
          var _a, _b;
          if ((_a = repo == null ? void 0 : repo.value) == null ? void 0 : _a.length) {
            const repoRiskData = (_b = repo == null ? void 0 : repo.value) == null ? void 0 : _b.reduce((riskCounter, row) => {
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
            }, {
              low: 0,
              medium: 0,
              high: 0
            });
            return {
              low: acc.low + repoRiskData.low,
              medium: acc.medium + repoRiskData.medium,
              high: acc.high + repoRiskData.high
            };
          }
          return acc;
        }, { low: 0, medium: 0, high: 0 });
      }
    }
    return riskDataResponce;
  }
  async getLeaksData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/security/leaks/?date_start=${options.dateStart}&date_end=${options.dateEnd}`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getServicesData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/slo/services/`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getSingleServiceData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/slo/${options.serviceName}/`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getErrorBudgetChartData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/slo/${options.serviceName}/${options.feature}/?date_start=${options.date_start}&date_end=${options.date_end}&step_size=${options.step_size}`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getTeamsData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/teams/`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getWorkspacesData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/bot/workspaces/`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getOrgUsersData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/settings/users/`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getUserPic(options) {
    const response = await fetch(`${this.proxyPath}/${options.url}`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  }
  async getEmoji(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/settings/emojis/`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getTeamKudosLeaderBoard(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/teams/${options.team}/leader_board/?date_start=${options.date_start}&date_end=${options.date_end}`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
  async getTeamKudosSankeyData(options) {
    const response = await fetch(`${this.proxyPath}/${options.orgHash}/teams/${options.team}/sankey_diagram/?date_start=${options.date_start}&date_end=${options.date_end}`, generateRequestParams(options.apiKey));
    if (!response.ok) {
      throw new Error(`There was a problem fetching analytics data: ${await generateErrorMessage(response)}`);
    }
    const state = await response.json();
    return state;
  }
}

const rootRouteRef = createRouteRef({
  id: "agile-analytics"
});

const agileAnalyticsPlugin = createPlugin({
  id: "agile-analytics",
  apis: [
    createApiFactory({
      api: agileAnalyticsApiRef,
      deps: { discoveryApi: discoveryApiRef },
      factory: ({ discoveryApi }) => new AgileAnalyticsAPIClient({ discoveryApi })
    })
  ],
  routes: {
    root: rootRouteRef
  }
});
const AgileAnalyticsPage = agileAnalyticsPlugin.provide(createRoutableExtension({
  name: "Agile Analytics Plugin Page",
  component: () => import('./index-524369cc.esm.js').then((m) => m.AaMainPageComponent),
  mountPoint: rootRouteRef
}));

export { AgileAnalyticsPage as A, getEndDate as a, agileAnalyticsApiRef as b, getUniqueListByParent as c, formatPlotLines as d, capitalizeFirstLetter as e, filterDataEvents as f, getStartDate as g, generateErrorBudgetChartOptionsBase as h, generateEventsChartOptionsBase as i, agileAnalyticsPlugin as j };
//# sourceMappingURL=index-0e5c1f1e.esm.js.map
