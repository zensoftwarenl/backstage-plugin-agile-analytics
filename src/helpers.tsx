import moment from 'moment';
import { Ticket } from './api/types';

// encoding
export function encodeApiKey(key: string): string {
  const encoded = Buffer.from(`${key}`).toString('base64');
  return encoded;
}

// timeperiod
export function getStartDate(
  amount: number,
  period: 'days' | 'months',
): number {
  return moment()
    .set({ hours: 0, minutes: 0, seconds: 0 })
    .subtract(amount, period)
    .unix();
}

export function getEndDate(): number {
  return moment().set({ hours: 23, minutes: 59, seconds: 59 }).unix();
}

// si page
export const getUniqueTasks = (arr: Ticket[]) => {
  const uniqueListofParents: Ticket[] = arr?.reduce(
    (acc: Ticket[], item: Ticket) => {
      // if item has no parent, include it
      if (!item?.parent) {
        return [...acc, item];
      }
      // if item has partent, but the parent is not in the list, include PARENT in the list with subtask's timestamp
      if (!arr?.find(arrItem => arrItem?.key === item?.parent?.key)) {
        // check if this parens has already been added
        if (!acc?.find(accItem => accItem?.key === item?.parent?.key)) {
          return [...acc, { ...item?.parent, timestamp: item?.timestamp }];
        }
      }
      // if the item hasa parent and parent is in the array, ignore the item (it will be included later as a subtask)
      return acc;
    },
    [],
  );

  const uniqueListOfLatest = uniqueListofParents?.map(item => {
    const subtasks = arr?.filter(ticket => ticket?.parent?.key === item?.key);
    // check if parent task have any subtasks which was updated later then the parent task.
    // if such subtasks exist, replase parent task timestamp with this latest one
    if (subtasks?.length) {
      const latestTimestamp = subtasks?.reduce((acc, subtask) => {
        if (subtask?.timestamp > acc) {
          return subtask?.timestamp;
        }
        return acc;
      }, item?.timestamp);
      return { ...item, timestamp: latestTimestamp, subtasks: subtasks };
    }

    return item;
  });

  return uniqueListOfLatest;
};

export function capitalizeFirstLetter(string: string): string {
  if (!string) {
    return string;
  }
  const capitalized =
    string[0].toUpperCase() + string.substring(1).toLowerCase();
  return capitalized;
}

export function generateEventsChartOptionsBase(
  setZoomTimeperiod: any,
  eventsVisibility: any,
  setEventsVisibility: any,
  step: string,
) {
  return {
    colors: ['#FF6384', '#8ec358'],
    chart: {
      type: 'column',
      height: 220,
      zooming: {
        type: 'x',
        resetButton: {
          position: { x: 0, y: -50 },
          theme: {
            display: 'none',
          },
        },
      },
      events: {
        selection: function (event: any): boolean {
          if (event.xAxis) {
            const selectedMin = event.xAxis[0]?.min;
            const selectedMax = event.xAxis[0]?.max;

            setZoomTimeperiod([selectedMin, selectedMax]);
          } else {
            setZoomTimeperiod(null);
          }
          return false;
        },
        render: function (this: any) {
          this?.resetZoomButton?.hide();
        },
      },
    },
    title: {
      text: '',
    },
    yAxis: {
      labels: {
        format: '{value}',
      },
      title: {
        enabled: false,
      },
      min: 0,
    },

    xAxis: {
      crosshair: true,
      type: 'datetime',
      labels: {
        format: '{value:%d %b %H:%M}',
        rotation: -50,
        align: 'right',
      },
    },
    credits: {
      enabled: false,
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        minPointLength: 2,
        events: {
          legendItemClick: function (this: any) {
            setEventsVisibility((prevState: any) => {
              if (eventsVisibility) {
                return {
                  ...prevState,
                  [this?.userOptions?.title]: {
                    ...prevState[this?.userOptions?.title],
                    [this?.userOptions?.name]:
                      !prevState[this?.userOptions?.title][
                        this?.userOptions?.name
                      ],
                  },
                };
              }
              return null;
            });
          },
        },
      },
    },

    tooltip: {
      formatter: function (this: any) {
        return this.points.reduce(
          function (s: any, point: any) {
            return (
              point?.series.name +
              ' ' +
              'in the last ' +
              step +
              ': ' +
              '<b>' +
              point?.y +
              '</b><br/>' +
              s
            );
          },
          this.points.length > 1
            ? 'Total: ' + '<b>' + this.points[0].total + '</b>'
            : '',
        );
      },
      shared: true,
    },

    legend: {
      labelFormatter: function (this: any) {
        return this.userOptions.title
          ? `<span><b>${this.userOptions.title + ':'} ${
              this.userOptions.name ?? ''
            }</b></span><br>`
          : `<b>${this.userOptions.name ?? ''}</b>`;
      },
    },
  };
}

export const ERROR_BUDGET_CHART_COLORS = [
  '#7902D7',
  '#F8C238',
  '#15A2BB',
  '#81BC42',
  '#D6DA33',
  '#484A53',
];

export const ERROR_BUDGET_CHART_SLO_COLORS = [
  'before:bg-[#7902D7]',
  'before:bg-[#F8C238]',
  'before:bg-[#15A2BB]',
  'before:bg-[#81BC42]',
  'before:bg-[#D6DA33]',
  'before:bg-[#484A53]',
];

export function generateErrorBudgetChartOptionsBase(
  dataFeaturesVisibility: any,
  setDataFeaturesVisibility: any,
  setZoomTimeperiod: any,
  isInTeam: boolean,
  step: string,
) {
  return {
    colors: ERROR_BUDGET_CHART_COLORS,
    chart: {
      type: 'line',
      height: 460,
      zooming: {
        type: 'x',
      },
      spacingTop: 40,
      events: {
        selection: function (event: any) {
          if (event.xAxis) {
            const selectedMin = event.xAxis[0]?.min;
            const selectedMax = event.xAxis[0]?.max;

            setZoomTimeperiod([selectedMin, selectedMax]);
          } else {
            setZoomTimeperiod(null);
          }
        },
        render: function (this: any) {
          this?.resetZoomButton?.hide();

          const chartContainer = this.container.parentNode;
          chartContainer.style.overflow = 'visible';
        },
      },
    },

    title: {
      text: '',
    },
    yAxis: {
      max: 100,

      ceiling: 100,
      alignTicks: false,
      endOnTick: false,
      labels: {
        format: '{value}%',
      },
      title: {
        enabled: false,
      },

      plotBands: [
        {
          color: '#f4f9ee',
          from: 0,
          to: 10000000000,
        },
        {
          // mark the weekend
          color: '#f9ebeb',
          from: -10000000000,
          to: 0,
        },
      ],
      // always show max tick
      tickPositioner: function (this: any) {
        const tickPositions = this.tickPositions;
        const lastTick = tickPositions[tickPositions.length - 1];
        const max = this.options.max;

        if (lastTick > max) {
          tickPositions.pop(); // remove last tick
          tickPositions.push(max);
        }
      },
    },
    xAxis: {
      crosshair: true,
      type: 'datetime',
      labels: {
        format: '{value:%d %b %H:%M}',
        rotation: -50,
        align: 'right',
      },
    },
    credits: {
      enabled: false,
    },
    plotOptions: {
      series: {
        // negativeColor: '#FF6384',
        opacity: 0.6,
        marker: {
          enabled: false,
        },
        events: {
          legendItemClick: function (this: any) {
            const name: string = this?.userOptions?.slo_name
              ? this?.userOptions?.service
                ? this?.userOptions?.slo_name + ' ' + this?.userOptions?.service
                : this?.userOptions?.slo_name
              : this?.userOptions?.title;
            setDataFeaturesVisibility(
              (prevState: { [name: string]: boolean }) => {
                return {
                  ...prevState,
                  [name]: !dataFeaturesVisibility[name],
                };
              },
            );
          },
        },
      },
    },
    tooltip: {
      shared: true,
      positioner: function (
        this: any,
        labelWidth: number,
        labelHeight: number,
        point: any,
      ) {
        const tooltipX: number =
          point.plotX < 250
            ? point.plotX + 70
            : point.plotX - this.label.width + 40;
        const tooltipY: number =
          (point?.plotY ? point?.plotY : 0) + this.label.height;
        return {
          x: tooltipX,
          y: tooltipY,
        };
      },
      formatter: function (this: any) {
        return this.points.reduce(function (s: any, point: any) {
          return (
            s +
            '<br/>' +
            `<span style="color:${point.color}">${
              point?.series?.userOptions?.slo_name
                ? isInTeam
                  ? point?.series?.userOptions?.slo_name +
                    '/' +
                    point?.series?.userOptions?.service
                  : point?.series?.userOptions?.slo_name
                : point?.series?.userOptions?.title
            }</span>` +
            `${isInTeam ? '' : ' ' + 'last' + ' ' + step}` +
            ': ' +
            (+point.y.toFixed(3) === 100 ? 100 : point.y.toFixed(3)) +
            '%'
          );
        }, moment(this.x).format('dddd, MMM D, HH:mm:ss'));
      },
    },

    legend: {
      labelFormatter: function (this: any) {
        return this.userOptions.slo_name
          ? `<b>SLO: </b><span>${this.userOptions.slo_name ?? ''}</span><br>
              <b>${capitalizeFirstLetter(
                isInTeam ? 'service' : 'description',
              )}: </b><span>${
              isInTeam
                ? this.userOptions.service
                : this.userOptions.slo_description ?? ''
            }</span><br> 

              <b>SLO target: </b><span>${
                this.userOptions.slo_target ?? ''
              }</span><br>`
          : `<b>${this.userOptions.title ?? ''}</b>`;
      },
    },
  };
}

export function formatDuration(milliseconds: number) {
  const duration = moment.duration(milliseconds);
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();

  const hoursText = hours === 1 ? 'hour' : 'hours';
  const minutesTest = minutes === 1 ? 'minute' : 'minutes';
  const hourStr = hours > 0 ? `${hours} ${hoursText}` : '';
  const minuteStr = minutes > 0 ? `${minutes} ${minutesTest}` : '';

  if (!hourStr && !minuteStr) {
    return '0 minutes'; // Handle case where both hours and minutes are 0
  }

  return [hourStr, minuteStr].filter(Boolean).join(' ');
}

export function formatPlotLinesTooltip(
  item: any,
  start: number,
  end: number,
  groupRangeString: string,
) {
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
</style><div class="deployment-plotline-tooltip basic-transition">${
    item?.deployments?.length
      ? item?.deployments?.length > 9
        ? '9+'
        : item?.deployments?.length
      : '1'
  }<div class="${
    item?.timestamp * 1000 - start - (end - start) / 2.5 < 0
      ? 'label-tooltip-container-left'
      : 'label-tooltip-container-right'
  } label-tooltip-container"><div class="label-tooltip basic-transition"><p class='label-tooltip-text label-tooltip-text-first'><b>Deployment date:</b> ${moment
    .unix(item?.timestamp)
    .format(
      'HH:mm:ss D.M.YY',
    )}</p><p class=' label-tooltip-text'><b>Project:</b> ${
    item?.repository
  }</p><p class='label-tooltip-text  font-bold'>Status: <span class='${
    item?.status === 'success' ? 'text-green' : 'text-red'
  }'>${item?.status}</span></p>
                                ${
                                  item?.type === 'group'
                                    ? `<p class="label-tooltip-text">
                                     <b>
                                         ...and ${item?.deployments?.length - 1}
                                         more
                                     </b>
                                     in the next ${groupRangeString}
                                 </p>`
                                    : ''
                                }</p></div></div></div></div>`;
}

function setDeployments(list: any[], dep: { timestamp: number }) {
  if (list?.length) {
    if (list[list?.length - 1]?.deployments?.length) {
      return [...list[list?.length - 1]?.deployments, dep];
    }
    return [list[list?.length - 1], dep];
  }
  return [];
}

export function formatPlotLines(
  deployments: { timestamp: number }[],
  start: number,
  end: number,
) {
  const groupRange = +((+end.toFixed(0) - +start.toFixed(0)) / 60).toFixed(0);
  const groupRangeString = formatDuration(groupRange);
  const groupedDeployments = deployments?.reduce(
    (acc: any[], dep: { timestamp: number }) => {
      if (dep?.timestamp * 1000 < start || dep?.timestamp * 1000 > end) {
        return acc;
      }
      if (
        !acc?.length ||
        dep?.timestamp * 1000 - acc[acc?.length - 1]?.timestamp * 1000 >
          groupRange
      ) {
        return [...acc, dep];
      }
      const copiedAcc = acc;
      return [
        ...copiedAcc.slice(0, copiedAcc?.length - 1),
        {
          ...acc[acc?.length - 1],
          type: 'group',
          deployments: setDeployments(copiedAcc, dep),
        },
      ];
    },
    [],
  );

  const formattedList = groupedDeployments?.length
    ? groupedDeployments.map(item => {
        return {
          value: item?.timestamp * 1000,
          color: '#666666',
          width: 1,
          dashStyle: 'LongDash',
          zIndex: 2,
          label: {
            useHTML: true,
            formatter: function () {
              return formatPlotLinesTooltip(item, start, end, groupRangeString);
            },
            y: -15,
            x: -1,
            align: 'center',
            rotation: 0,
            style: {
              fontSize: 14,
              overflow: 'visible',
            },
          },
        };
      })
    : null;
  return formattedList;
}

export function filterDataEvents(fullData: any[], min: number, max: number) {
  const filtered = fullData?.map(dataset => {
    const updatedData = dataset?.data?.filter((item: number[]) => {
      if (item?.length && item[0] >= min && item[0] <= max) {
        return item;
      }
      return null;
    });
    return { ...dataset, data: [...updatedData] };
  });
  return filtered;
}

export function getSloColor(i: number, isTeam = false) {
  let colorIndex = i;

  if (isTeam) {
    colorIndex += 3;
  }
  while (colorIndex >= ERROR_BUDGET_CHART_SLO_COLORS?.length) {
    colorIndex = colorIndex - ERROR_BUDGET_CHART_SLO_COLORS?.length;
  }

  return ERROR_BUDGET_CHART_SLO_COLORS[colorIndex];
}
