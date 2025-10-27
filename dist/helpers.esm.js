import moment from 'moment';

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
const getUniqueTasks = (arr) => {
  const uniqueListofParents = arr?.reduce(
    (acc, item) => {
      if (!item?.parent) {
        return [...acc, item];
      }
      if (!arr?.find((arrItem) => arrItem?.key === item?.parent?.key)) {
        if (!acc?.find((accItem) => accItem?.key === item?.parent?.key)) {
          return [...acc, { ...item?.parent, timestamp: item?.timestamp }];
        }
      }
      return acc;
    },
    []
  );
  const uniqueListOfLatest = uniqueListofParents?.map((item) => {
    const subtasks = arr?.filter((ticket) => ticket?.parent?.key === item?.key);
    if (subtasks?.length) {
      const latestTimestamp = subtasks?.reduce((acc, subtask) => {
        if (subtask?.timestamp > acc) {
          return subtask?.timestamp;
        }
        return acc;
      }, item?.timestamp);
      return { ...item, timestamp: latestTimestamp, subtasks };
    }
    return item;
  });
  return uniqueListOfLatest;
};
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
          if (event.xAxis) {
            const selectedMin = event.xAxis[0]?.min;
            const selectedMax = event.xAxis[0]?.max;
            setZoomTimeperiod([selectedMin, selectedMax]);
          } else {
            setZoomTimeperiod(null);
          }
          return false;
        },
        render: function() {
          this?.resetZoomButton?.hide();
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
              if (eventsVisibility) {
                return {
                  ...prevState,
                  [this?.userOptions?.title]: {
                    ...prevState[this?.userOptions?.title],
                    [this?.userOptions?.name]: !prevState[this?.userOptions?.title][this?.userOptions?.name]
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
        return this.points.reduce(
          function(s, point) {
            return point?.series.name + " in the last " + step + ": <b>" + point?.y + "</b><br/>" + s;
          },
          this.points.length > 1 ? "Total: <b>" + this.points[0].total + "</b>" : ""
        );
      },
      shared: true
    },
    legend: {
      labelFormatter: function() {
        return this.userOptions.title ? `<span><b>${this.userOptions.title + ":"} ${this.userOptions.name ?? ""}</b></span><br>` : `<b>${this.userOptions.name ?? ""}</b>`;
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
          if (event.xAxis) {
            const selectedMin = event.xAxis[0]?.min;
            const selectedMax = event.xAxis[0]?.max;
            setZoomTimeperiod([selectedMin, selectedMax]);
          } else {
            setZoomTimeperiod(null);
          }
        },
        render: function() {
          this?.resetZoomButton?.hide();
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
          // mark the weekend
          color: "#f9ebeb",
          from: -1e10,
          to: 0
        }
      ],
      // always show max tick
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
        // negativeColor: '#FF6384',
        opacity: 0.6,
        marker: {
          enabled: false
        },
        events: {
          legendItemClick: function() {
            const name = this?.userOptions?.slo_name ? this?.userOptions?.service ? this?.userOptions?.slo_name + " " + this?.userOptions?.service : this?.userOptions?.slo_name : this?.userOptions?.title;
            setDataFeaturesVisibility(
              (prevState) => {
                return {
                  ...prevState,
                  [name]: !dataFeaturesVisibility[name]
                };
              }
            );
          }
        }
      }
    },
    tooltip: {
      shared: true,
      positioner: function(labelWidth, labelHeight, point) {
        const tooltipX = point.plotX < 250 ? point.plotX + 70 : point.plotX - this.label.width + 40;
        const tooltipY = (point?.plotY ? point?.plotY : 0) + this.label.height;
        return {
          x: tooltipX,
          y: tooltipY
        };
      },
      formatter: function() {
        return this.points.reduce(function(s, point) {
          return s + `<br/><span style="color:${point.color}">${point?.series?.userOptions?.slo_name ? point?.series?.userOptions?.slo_name : point?.series?.userOptions?.title}</span>${" last " + step}: ` + (+point.y.toFixed(3) === 100 ? 100 : point.y.toFixed(3)) + "%";
        }, moment(this.x).format("dddd, MMM D, HH:mm:ss"));
      }
    },
    legend: {
      labelFormatter: function() {
        return this.userOptions.slo_name ? `<b>SLO: </b><span>${this.userOptions.slo_name ?? ""}</span><br>
              <b>${capitalizeFirstLetter(
          "description"
        )}: </b><span>${this.userOptions.slo_description ?? ""}</span><br> 

              <b>SLO target: </b><span>${this.userOptions.slo_target ?? ""}</span><br>` : `<b>${this.userOptions.title ?? ""}</b>`;
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
  return `<div><style>
  .deployment-plotline-tooltip {
  overflow: visible;
  position: relative;
  padding: 8px;
  width: 16px;
  height: 16px;
  border-radius: 1000%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid gray;
  color: gray;
  font-size: 10px;
}
  .deployment-plotline-tooltip:hover {
  border-color: #000000de;
  color: #000000de;
}

.basic-transition {
  transform: translateZ(0); /* triggers GPU acceleration, optional but common */
  transition-property: all;
  transition-duration: 200ms;
  transition-timing-function: ease-in;
}
.highcharts-plot-line-label,
.highcharts-root,
.highcharts-container {
  overflow: visible !important;
  overflow-x: visible !important;
  overflow-y: visible !important;
}

.highcharts-plot-line-label .label-tooltip-container .label-tooltip {
  width: 280px;
  overflow: hidden;
  border: 0px solid #cccccc;
  box-sizing: border-box;
  transform: translate(0, 100%);
}

.highcharts-plot-line-label:hover .label-tooltip-container .label-tooltip {
  width: 280px;
  border: 1px solid #cccccc;
  box-sizing: border-box;
  transform: translate(0, 0);
}

.highcharts-plot-line-label .label-tooltip-container {
  width: 0;
}

.highcharts-plot-line-label:hover .label-tooltip-container {
  width: 280px;
}

.label-tooltip-container {
  position: absolute;
  top: -76px;
  overflow: hidden;
  z-index: -50;
}

.label-tooltip-container-left {
  left: -8px;
}
.label-tooltip-container-right {
  right: -8px;
}

.label-tooltip {
  background-color: white;
  cursor: default;
  color: #000000de;
  display: flex;
  flex-direction: column;
  justify-content: start;
  font-size: 12px;
  height: 74px;
  overflow: hidden;
}

.label-tooltip-text-first {
  padding-top: 4px;
}

.label-tooltip-text {
  background-color: white;
  flex-shrink: 0;
  height: 16px;
  margin: 0;
  padding: 0px 4px;
  overflow: hidden;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  background-color: transparent;
}
  
.font-bold {
  font-weight: 700;
}

.text-green {
  color: rgb(142, 195, 88);
}

.text-red {
  color: rgb(192, 58, 58);
}
</style><div class="deployment-plotline-tooltip basic-transition">${item?.deployments?.length ? item?.deployments?.length > 9 ? "9+" : item?.deployments?.length : "1"}<div class="${item?.timestamp * 1e3 - start - (end - start) / 2.5 < 0 ? "label-tooltip-container-left" : "label-tooltip-container-right"} label-tooltip-container"><div class="label-tooltip basic-transition"><p class='label-tooltip-text label-tooltip-text-first'><b>Deployment date:</b> ${moment.unix(item?.timestamp).format(
    "HH:mm:ss D.M.YY"
  )}</p><p class=' label-tooltip-text'><b>Project:</b> ${item?.repository}</p><p class='label-tooltip-text  font-bold'>Status: <span class='${item?.status === "success" ? "text-green" : "text-red"}'>${item?.status}</span></p>
                                ${item?.type === "group" ? `<p class="label-tooltip-text">
                                     <b>
                                         ...and ${item?.deployments?.length - 1}
                                         more
                                     </b>
                                     in the next ${groupRangeString}
                                 </p>` : ""}</p></div></div></div></div>`;
}
function setDeployments(list, dep) {
  if (list?.length) {
    if (list[list?.length - 1]?.deployments?.length) {
      return [...list[list?.length - 1]?.deployments, dep];
    }
    return [list[list?.length - 1], dep];
  }
  return [];
}
function formatPlotLines(deployments, start, end) {
  const groupRange = +((+end.toFixed(0) - +start.toFixed(0)) / 60).toFixed(0);
  const groupRangeString = formatDuration(groupRange);
  const groupedDeployments = deployments?.reduce(
    (acc, dep) => {
      if (dep?.timestamp * 1e3 < start || dep?.timestamp * 1e3 > end) {
        return acc;
      }
      if (!acc?.length || dep?.timestamp * 1e3 - acc[acc?.length - 1]?.timestamp * 1e3 > groupRange) {
        return [...acc, dep];
      }
      const copiedAcc = acc;
      return [
        ...copiedAcc.slice(0, copiedAcc?.length - 1),
        {
          ...acc[acc?.length - 1],
          type: "group",
          deployments: setDeployments(copiedAcc, dep)
        }
      ];
    },
    []
  );
  const formattedList = groupedDeployments?.length ? groupedDeployments.map((item) => {
    return {
      value: item?.timestamp * 1e3,
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
  const filtered = fullData?.map((dataset) => {
    const updatedData = dataset?.data?.filter((item) => {
      if (item?.length && item[0] >= min && item[0] <= max) {
        return item;
      }
      return null;
    });
    return { ...dataset, data: [...updatedData] };
  });
  return filtered;
}

export { ERROR_BUDGET_CHART_COLORS, capitalizeFirstLetter, encodeApiKey, filterDataEvents, formatDuration, formatPlotLines, formatPlotLinesTooltip, generateErrorBudgetChartOptionsBase, generateEventsChartOptionsBase, getEndDate, getStartDate, getUniqueTasks };
//# sourceMappingURL=helpers.esm.js.map
