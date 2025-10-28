import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@material-ui/core';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { generateErrorBudgetChartOptionsBase, generateEventsChartOptionsBase, filterDataEvents, formatPlotLines, capitalizeFirstLetter } from '../../helpers.esm.js';
import _ from 'lodash';

const chartManager = [];
let rafId = null;
Highcharts.Pointer.prototype.reset = function() {
  return void 0;
};
const onMouseLeave = () => {
  if (chartManager.length > 1) {
    chartManager?.forEach((chart) => {
      chart?.tooltip?.hide();
    });
  }
};
const onMouseMove = (event, target) => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    const hoverPoint = target.hoverPoint;
    const currentService = target?.userOptions?.service;
    const chartsFilteredByService = chartManager?.length ? chartManager?.filter((item) => {
      return item?.userOptions?.service === currentService;
    }) : [];
    if (hoverPoint && chartsFilteredByService?.length > 1) {
      chartsFilteredByService?.forEach((chart) => {
        const { series = [], xAxis = [] } = chart;
        if (!series || series?.length === 0) {
          return;
        }
        const visibleSeries = series.filter((serie) => serie.visible);
        const points = visibleSeries.reduce((memo, serie) => {
          memo.push(...serie.points);
          return memo;
        }, []);
        const { min, max } = {
          min: xAxis[0].min,
          max: xAxis[xAxis?.length - 1].max
        };
        const point = points?.find((item) => item.x === hoverPoint.x);
        if (point && point?.formatPrefix === "point") {
          if (point?.series && hoverPoint.x >= min && hoverPoint.x <= max) {
            point?.onMouseOver();
          } else {
            chart.tooltip.hide();
          }
        }
      });
    }
    rafId = null;
  });
};
const registerChart = (target) => {
  const index = chartManager.indexOf(target);
  if (index < 0) {
    chartManager.push(target);
  }
};
const unregisterChart = (target) => {
  const index = chartManager.indexOf(target);
  if (index >= 0) {
    chartManager.splice(index, 1);
  }
};
const syncTooltip = (target) => {
  if (!target || !target.container) {
    return false;
  }
  registerChart(target);
  const mouseMoveHandler = (event) => onMouseMove(event, target);
  target.container.addEventListener("mousemove", mouseMoveHandler);
  const mouseLeaveHandler = (event) => onMouseLeave();
  target.container.addEventListener("mouseleave", mouseLeaveHandler);
  return () => {
    unregisterChart(target);
    target.container.removeEventListener("mousemove", mouseMoveHandler);
    target.container.removeEventListener("mouseleave", mouseLeaveHandler);
  };
};
const SyncChart = ({ options }) => {
  const chartComponentRef = useRef(null);
  Highcharts.setOptions({
    // global: {
    //   useUTC: false,
    // },
    lang: {
      months: [
        capitalizeFirstLetter("January"),
        capitalizeFirstLetter("February"),
        capitalizeFirstLetter("March"),
        capitalizeFirstLetter("April"),
        capitalizeFirstLetter("May"),
        capitalizeFirstLetter("June"),
        capitalizeFirstLetter("July"),
        capitalizeFirstLetter("August"),
        capitalizeFirstLetter("September"),
        capitalizeFirstLetter("October"),
        capitalizeFirstLetter("November"),
        capitalizeFirstLetter("December")
      ],
      shortMonths: [
        capitalizeFirstLetter("Jan"),
        capitalizeFirstLetter("Feb"),
        capitalizeFirstLetter("Mar"),
        capitalizeFirstLetter("Apr"),
        capitalizeFirstLetter("May"),
        capitalizeFirstLetter("Jun"),
        capitalizeFirstLetter("Jul"),
        capitalizeFirstLetter("Aug"),
        capitalizeFirstLetter("Sep"),
        capitalizeFirstLetter("Oct"),
        capitalizeFirstLetter("Nov"),
        capitalizeFirstLetter("Dec")
      ],
      weekdays: [
        capitalizeFirstLetter("Sunday"),
        capitalizeFirstLetter("Monday"),
        capitalizeFirstLetter("Tuesday"),
        capitalizeFirstLetter("Wednesday"),
        capitalizeFirstLetter("Thursday"),
        capitalizeFirstLetter("Friday"),
        capitalizeFirstLetter("Saturday")
      ]
    }
  });
  useEffect(() => {
    if (chartComponentRef.current) {
      chartComponentRef?.current?.chart?.xAxis[0].setExtremes();
      chartComponentRef?.current?.chart?.yAxis[0].setExtremes();
    }
    const chart = chartComponentRef?.current?.chart;
    syncTooltip(chart);
  }, [options]);
  return /* @__PURE__ */ jsx(
    HighchartsReact,
    {
      id: "highchart",
      ref: chartComponentRef,
      highcharts: Highcharts,
      options: options?.length ? [...options] : options
    }
  );
};
const AaErrorBudgetsChart = ({
  timeperiod,
  selectedService,
  serviceState,
  step,
  chartState,
  deploymentsList
}) => {
  const [zoomTimeperiod, setZoomTimeperiod] = useState(null);
  const [dataFeaturesVisibility, setDataFeaturesVisibility] = useState(null);
  const [eventsVisibility, setEventsVisibility] = useState(null);
  const errorBudgetChartOptionsBase = generateErrorBudgetChartOptionsBase(
    dataFeaturesVisibility,
    setDataFeaturesVisibility,
    setZoomTimeperiod,
    false,
    step
  );
  const eventsChartOptionsBase = generateEventsChartOptionsBase(
    setZoomTimeperiod,
    eventsVisibility,
    setEventsVisibility,
    step
  );
  const featuresList = serviceState?.features?.map(
    (feature) => feature.slo_name
  );
  const [data, setData] = useState([[null, null]]);
  const [dataEvents, setDataEvents] = useState([[null, null]]);
  const [wasChartDataFormatted, setWasChartDataFormatted] = useState(false);
  const [deploymentsVisible, setDeploymentsVisible] = useState(true);
  const [zoomedDataEvents, setZoomedDataEvents] = useState(null);
  const [zoomedData, setZoomedData] = useState(null);
  const [eventsChartSeries, setEventsChartSeries] = useState(null);
  const [errorBudgetChartSeries, setErrorBudgetChartSeries] = useState(null);
  useEffect(() => {
    setWasChartDataFormatted(false);
  }, [timeperiod, selectedService, step]);
  useEffect(() => {
    if (chartState?.data?.length) {
      let formattedData = data;
      if (!wasChartDataFormatted) {
        formattedData = chartState?.data?.map((feature) => {
          if (feature?.data) {
            feature.data.map((item) => {
              item[0] = item[0] * 1e3;
              return item;
            });
          }
          return feature;
        });
        setWasChartDataFormatted(true);
      } else {
        formattedData = chartState?.data?.map((feature) => {
          if (feature?.data) {
            feature.data?.map((item) => {
              return item;
            });
          }
          return feature;
        });
        setWasChartDataFormatted(true);
      }
      const formattedDataWithOptions = formattedData.map((dataSeries) => {
        const formattedSeries = {
          ...dataSeries,
          data: [...dataSeries?.data],
          name: dataSeries.feature,
          tooltip: {
            valueSuffix: " %"
          },
          visible: true
        };
        return formattedSeries;
      });
      setData(formattedDataWithOptions);
      const eventsData = formattedData.reduce(
        (acc, seriesData, index) => {
          const columnsBadSeries = {
            ...seriesData,
            title: seriesData.slo_name,
            type: "column",
            data: [...seriesData?.data].map((dataItem) => {
              if (dataItem?.length) {
                return [
                  dataItem[0],
                  dataItem[2].bad_events === 0 ? null : dataItem[2].bad_events
                ];
              }
              return [null, null];
            }),
            name: "Bad events",
            color: "#FF6384",
            id: index.toString()
          };
          const columnsGoodSeries = {
            ...seriesData,
            title: seriesData.slo_name,
            type: "column",
            data: [...seriesData?.data].map((dataItem) => {
              if (dataItem?.length) {
                return [
                  dataItem[0],
                  dataItem[2].good_events === 0 ? null : dataItem[2].good_events
                ];
              }
              return [null, null];
            }),
            name: "Good events",
            color: "#8ec358",
            visible: false
          };
          return [...acc, columnsBadSeries, columnsGoodSeries];
        },
        []
      );
      setDataEvents([...eventsData]);
    }
  }, [chartState?.data, serviceState]);
  useEffect(() => {
    const visibility = data.reduce((acc, dataSeries) => {
      return {
        ...acc,
        [dataSeries?.slo_name ? dataSeries?.slo_name : dataSeries?.title]: true
      };
    }, {});
    setDataFeaturesVisibility(visibility);
    const updatedErrorBudgetOptions = {
      ...errorBudgetChartOptionsBase,
      series: [...data].map((series) => {
        return {
          ...series,
          visible: visibility ? visibility[series?.slo_name ? series?.slo_name : series?.name] : true
        };
      }),
      xAxis: {
        ...errorBudgetChartOptionsBase.xAxis,
        plotLines: null
      },
      service: selectedService
    };
    setErrorBudgetChartSeries(updatedErrorBudgetOptions);
    setZoomTimeperiod(null);
  }, [data]);
  useEffect(() => {
    const visibility = dataEvents.reduce((acc, dataSeries) => {
      if (dataSeries?.id) {
        return {
          ...acc,
          [dataSeries.title]: {
            [dataSeries?.name]: true
          }
        };
      }
      return {
        ...acc,
        [dataSeries.title]: {
          ...acc[dataSeries?.title],
          [dataSeries?.name]: false
        }
      };
    }, {});
    setEventsVisibility(visibility);
    if (dataFeaturesVisibility && Object.keys(dataFeaturesVisibility)?.length) {
      const updatedEventsChartSeries = Object.keys(
        dataFeaturesVisibility
      ).reduce((acc, featureName) => {
        const updatedAcc = {
          ...acc,
          [featureName]: {
            ...eventsChartOptionsBase,
            series: [...dataEvents].filter((dataSeries) => dataSeries.title === featureName)?.map((series) => {
              const updated = {
                ...series,
                visible: series?.id ? true : false
              };
              return updated;
            }),
            service: selectedService
          }
        };
        return updatedAcc;
      }, {});
      setEventsChartSeries(updatedEventsChartSeries);
    }
  }, [dataEvents]);
  useEffect(() => {
    if (dataFeaturesVisibility && Object.keys(dataFeaturesVisibility)?.length) {
      const updatedEventsChartSeries = Object.keys(
        dataFeaturesVisibility
      ).reduce((acc, featureName) => {
        const updatedAcc = {
          ...acc,
          [featureName]: {
            ...eventsChartOptionsBase,
            series: zoomTimeperiod ? [...zoomedDataEvents ?? []].filter((dataSeries) => dataSeries.title === featureName)?.map((series) => {
              const updated = {
                ...series,
                visible: eventsVisibility ? eventsVisibility[featureName][series?.name] : null
              };
              return updated;
            }) : [...dataEvents].filter((dataSeries) => dataSeries.title === featureName)?.map((series) => {
              const updated = {
                ...series,
                visible: eventsVisibility ? eventsVisibility[featureName][series?.name] : null
              };
              return updated;
            }),
            service: selectedService
          }
        };
        return updatedAcc;
      }, {});
      setEventsChartSeries(updatedEventsChartSeries);
    }
  }, [zoomedDataEvents, eventsVisibility]);
  useEffect(() => {
    if (dataFeaturesVisibility && Object.keys(dataFeaturesVisibility)?.length) {
      const copiedDataEvents = _.cloneDeep(dataEvents);
      const updatedEventsOptions = Object.keys(dataFeaturesVisibility).reduce(
        (acc, featureName) => {
          const updatedAcc = {
            ...acc,
            [featureName]: {
              ...eventsChartOptionsBase,
              series: zoomTimeperiod ? [...zoomedDataEvents ?? []]?.filter((dataSeries) => dataSeries.title === featureName)?.map((series) => {
                const updated = {
                  ...series,
                  visible: eventsVisibility ? eventsVisibility[featureName][series?.name] : null
                };
                return updated;
              }) : [...copiedDataEvents].filter((dataSeries) => dataSeries.title === featureName)?.map((series) => {
                const updated = {
                  ...series,
                  visible: eventsVisibility ? eventsVisibility[featureName][series?.name] : null
                };
                return updated;
              }),
              service: selectedService
            }
          };
          return updatedAcc;
        },
        {}
      );
      setEventsChartSeries(updatedEventsOptions);
      const copiedData = _.cloneDeep(data);
      const updatedErrorBudgetOptions = {
        ...errorBudgetChartOptionsBase,
        series: zoomTimeperiod ? [...zoomedData].map((series) => {
          return {
            ...series,
            visible: dataFeaturesVisibility ? dataFeaturesVisibility[series?.slo_name ? series?.slo_name : series?.name] : true
          };
        }) : [...copiedData].map((series) => {
          return {
            ...series,
            visible: dataFeaturesVisibility ? dataFeaturesVisibility[series?.slo_name ? series?.slo_name : series?.name] : true
          };
        }),
        xAxis: {
          ...errorBudgetChartOptionsBase.xAxis,
          plotLines: null
        },
        service: selectedService
      };
      setErrorBudgetChartSeries(updatedErrorBudgetOptions);
    }
  }, [zoomedDataEvents, zoomedData, dataFeaturesVisibility]);
  useEffect(() => {
    const updatedErrorBudgetOptions = {
      ...errorBudgetChartOptionsBase,
      series: errorBudgetChartSeries?.series?.map((series) => {
        return {
          ...series,
          visible: dataFeaturesVisibility ? dataFeaturesVisibility[series?.slo_name ? series?.slo_name : series?.name] : true
        };
      }),
      xAxis: {
        ...errorBudgetChartOptionsBase.xAxis,
        plotLines: null
      },
      service: selectedService
    };
    setErrorBudgetChartSeries(updatedErrorBudgetOptions);
  }, [deploymentsVisible]);
  useEffect(() => {
    const copiedDataEvents = _.cloneDeep(dataEvents);
    const copiedData = _.cloneDeep(data);
    if (!zoomTimeperiod) {
      setZoomedDataEvents([...copiedDataEvents]);
      setZoomedData([...copiedData]);
    } else {
      if (copiedDataEvents) {
        const filteredEvents = filterDataEvents(
          [...copiedDataEvents],
          zoomTimeperiod[0],
          zoomTimeperiod[1]
        );
        setZoomedDataEvents(filteredEvents);
      }
      if (copiedData) {
        const filteredData = filterDataEvents(
          [...copiedData],
          zoomTimeperiod[0],
          zoomTimeperiod[1]
        );
        setZoomedData([...filteredData]);
      }
    }
  }, [zoomTimeperiod]);
  if (!featuresList?.length) {
    return /* @__PURE__ */ jsx("div", { className: "mr-5", style: { width: "100%", height: "190px" }, children: /* @__PURE__ */ jsx("p", { className: "text-center text-gray-500 text-xl p-4", children: "No SLOs. Add a SLO to start gathering data" }) });
  }
  const clonedOptions = JSON.parse(JSON.stringify(errorBudgetChartSeries));
  if (errorBudgetChartSeries?.chart?.events) {
    clonedOptions.chart.events = errorBudgetChartSeries.chart.events;
    clonedOptions.tooltip.formatter = errorBudgetChartSeries.tooltip.formatter;
    clonedOptions.tooltip.positioner = errorBudgetChartSeries.tooltip.positioner;
    clonedOptions.plotOptions = errorBudgetChartSeries.plotOptions;
    clonedOptions.legend = errorBudgetChartSeries.legend;
    clonedOptions.legend.labelFormatter = errorBudgetChartSeries.legend.labelFormatter;
    clonedOptions.xAxis.plotLines = deploymentsVisible ? zoomTimeperiod ? formatPlotLines(deploymentsList, zoomTimeperiod[0], zoomTimeperiod[1]) : formatPlotLines(
      deploymentsList,
      timeperiod?.date_start * 1e3,
      timeperiod?.date_end * 1e3
    ) : null;
  }
  const style = {
    height: "42px",
    display: "flex",
    justifyContent: "end",
    alignItems: "center",
    gap: "12px"
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxs(Box, { className: "absolute ", sx: style, children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "contained",
          onClick: () => {
            setDeploymentsVisible((prevState) => !prevState);
          },
          children: [
            deploymentsVisible ? "Hide" : "Show",
            " deployments"
          ]
        }
      ),
      zoomTimeperiod ? /* @__PURE__ */ jsx(
        Button,
        {
          variant: "outlined",
          onClick: () => {
            setZoomTimeperiod(null);
          },
          children: "Reset zoom"
        }
      ) : null
    ] }),
    clonedOptions ? /* @__PURE__ */ jsx(SyncChart, { options: clonedOptions }) : null,
    /* @__PURE__ */ jsx("div", { children: dataFeaturesVisibility && Object.keys(dataFeaturesVisibility).map((featureName, i) => {
      if (dataFeaturesVisibility[featureName]) {
        return /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(
            Box,
            {
              className: "",
              sx: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
                marginTop: "48px"
              },
              children: [
                /* @__PURE__ */ jsxs(Typography, { variant: "h6", component: "p", children: [
                  featureName,
                  " good/bad events"
                ] }),
                zoomTimeperiod ? /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outlined",
                    onClick: () => {
                      setZoomTimeperiod(null);
                    },
                    children: "Reset zoom"
                  }
                ) : null
              ]
            }
          ),
          eventsChartSeries && eventsChartSeries[featureName] ? /* @__PURE__ */ jsx(SyncChart, { options: eventsChartSeries[featureName] }) : null
        ] }, featureName);
      }
      return null;
    }) })
  ] });
};

export { AaErrorBudgetsChart };
//# sourceMappingURL=AaErrorBudgetsChart.esm.js.map
