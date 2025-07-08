/* eslint-disable no-console */
import React, { useEffect, useRef, useState } from 'react';
import '../../index.css';
import { Box, Button, Typography } from '@material-ui/core';
import { Timeperiod } from '../../api/types';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import {
  capitalizeFirstLetter,
  filterDataEvents,
  formatPlotLines,
  generateErrorBudgetChartOptionsBase,
  generateEventsChartOptionsBase,
} from '../../helpers';
import _ from 'lodash';

const chartManager: {
  tooltip?: any;
}[] = [];
let rafId: number | string | null = null;

Highcharts.Pointer.prototype.reset = function () {
  return undefined;
};

const onMouseLeave = () => {
  if (chartManager.length > 1) {
    chartManager?.forEach(chart => {
      chart?.tooltip?.hide();
    });
  }
};

const onMouseMove = (event: any, target: any) => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    const hoverPoint = target.hoverPoint;
    const currentService = target?.userOptions?.service;
    const chartsFilteredByService = chartManager?.length
      ? chartManager?.filter((item: any) => {
          return item?.userOptions?.service === currentService;
        })
      : [];

    if (hoverPoint && chartsFilteredByService?.length > 1) {
      chartsFilteredByService?.forEach((chart: any) => {
        const { series = [], xAxis = [] } = chart;
        if (!series || series?.length === 0) {
          return;
        }

        const visibleSeries = series.filter((serie: any) => serie.visible);
        const points = visibleSeries.reduce((memo: any, serie: any) => {
          memo.push(...serie.points);
          return memo;
        }, []);
        const { min, max } = {
          min: xAxis[0].min,
          max: xAxis[xAxis?.length - 1].max,
        };
        const point = points?.find((item: any) => item.x === hoverPoint.x);

        if (point && point?.formatPrefix === 'point') {
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

const registerChart = (target: any) => {
  const index = chartManager.indexOf(target);
  if (index < 0) {
    chartManager.push(target);
  }
};

const unregisterChart = (target: any) => {
  const index = chartManager.indexOf(target);

  if (index >= 0) {
    chartManager.splice(index, 1);
  }
};

const syncTooltip = (target: any) => {
  if (!target || !target.container) {
    return false;
  }
  registerChart(target);

  const mouseMoveHandler = (event: any) => onMouseMove(event, target);
  target.container.addEventListener('mousemove', mouseMoveHandler);
  const mouseLeaveHandler = (event: any) => onMouseLeave();
  target.container.addEventListener('mouseleave', mouseLeaveHandler);

  return () => {
    unregisterChart(target);
    target.container.removeEventListener('mousemove', mouseMoveHandler);
    target.container.removeEventListener('mouseleave', mouseLeaveHandler);
  };
};

const SyncChart = ({ options }: { options: any }) => {
  const chartComponentRef: any = useRef(null);

  Highcharts.setOptions({
    // global: {
    //   useUTC: false,
    // },
    lang: {
      months: [
        capitalizeFirstLetter('January'),
        capitalizeFirstLetter('February'),
        capitalizeFirstLetter('March'),
        capitalizeFirstLetter('April'),
        capitalizeFirstLetter('May'),
        capitalizeFirstLetter('June'),
        capitalizeFirstLetter('July'),
        capitalizeFirstLetter('August'),
        capitalizeFirstLetter('September'),
        capitalizeFirstLetter('October'),
        capitalizeFirstLetter('November'),
        capitalizeFirstLetter('December'),
      ],
      shortMonths: [
        capitalizeFirstLetter('Jan'),
        capitalizeFirstLetter('Feb'),
        capitalizeFirstLetter('Mar'),
        capitalizeFirstLetter('Apr'),
        capitalizeFirstLetter('May'),
        capitalizeFirstLetter('Jun'),
        capitalizeFirstLetter('Jul'),
        capitalizeFirstLetter('Aug'),
        capitalizeFirstLetter('Sep'),
        capitalizeFirstLetter('Oct'),
        capitalizeFirstLetter('Nov'),
        capitalizeFirstLetter('Dec'),
      ],
      weekdays: [
        capitalizeFirstLetter('Sunday'),
        capitalizeFirstLetter('Monday'),
        capitalizeFirstLetter('Tuesday'),
        capitalizeFirstLetter('Wednesday'),
        capitalizeFirstLetter('Thursday'),
        capitalizeFirstLetter('Friday'),
        capitalizeFirstLetter('Saturday'),
      ],
    },
  });

  useEffect(() => {
    if (chartComponentRef.current) {
      chartComponentRef?.current?.chart?.xAxis[0].setExtremes();
      chartComponentRef?.current?.chart?.yAxis[0].setExtremes();
    }

    const chart = chartComponentRef?.current?.chart;
    syncTooltip(chart);
  }, [options]);

  return (
    <HighchartsReact
      id="highchart"
      ref={chartComponentRef}
      highcharts={Highcharts}
      options={options?.length ? [...options] : options}
    />
  );
};

export const AaErrorBudgetsChart = ({
  timeperiod,
  selectedService,
  serviceState,
  step,
  chartState,
  deploymentsList,
}: {
  timeperiod: Timeperiod;
  selectedService: string;
  serviceState: any;
  step: string;
  chartState: any;
  deploymentsList: any;
  }) => {
  const [zoomTimeperiod, setZoomTimeperiod] = useState(null);
  const [dataFeaturesVisibility, setDataFeaturesVisibility] = useState(null);
  const [eventsVisibility, setEventsVisibility] = useState(null);

  const errorBudgetChartOptionsBase = generateErrorBudgetChartOptionsBase(
    dataFeaturesVisibility,
    setDataFeaturesVisibility,
    setZoomTimeperiod,
    false,
    step,
  );

  const eventsChartOptionsBase = generateEventsChartOptionsBase(
    setZoomTimeperiod,
    eventsVisibility,
    setEventsVisibility,
    step,
  );

  const featuresList = serviceState?.features?.map(
    (feature: any) => feature.slo_name,
  );

  const [data, setData] = useState<any>([[null, null]]);
  const [dataEvents, setDataEvents] = useState<any>([[null, null]]);
  const [wasChartDataFormatted, setWasChartDataFormatted] =
    useState<boolean>(false);
  const [deploymentsVisible, setDeploymentsVisible] = useState<boolean>(true);

  const [zoomedDataEvents, setZoomedDataEvents] = useState<any>(null);
  const [zoomedData, setZoomedData] = useState<any>(null);
  const [eventsChartSeries, setEventsChartSeries] = useState<any>(null);
  const [errorBudgetChartSeries, setErrorBudgetChartSeries] =
    useState<any>(null);

  useEffect(() => {
    setWasChartDataFormatted(false);
  }, [timeperiod, selectedService, step]);

  useEffect(() => {
    if (chartState?.data?.length) {
      let formattedData = data;
      if (!wasChartDataFormatted) {
        formattedData = chartState?.data?.map((feature: any) => {
          if (feature?.data) {
            feature.data.map((item: number[]) => {
              item[0] = item[0] * 1000;
              return item;
            });
          }

          return feature;
        });
        setWasChartDataFormatted(true);
      } else {
        formattedData = chartState?.data?.map((feature: any) => {
          if (feature?.data) {
            feature.data?.map((item: any) => {
              return item;
            });
          }
          return feature;
        });
        setWasChartDataFormatted(true);
      }

      const formattedDataWithOptions = formattedData.map(
        (dataSeries: any) => {
          const formattedSeries = {
            ...dataSeries,
            data: [...dataSeries?.data],
            name: dataSeries.feature,
            tooltip: {
              valueSuffix: ' %',
            },
            visible: true,
          };
          return formattedSeries;
        },
      );

      setData(formattedDataWithOptions);

      const eventsData = formattedData.reduce(
        (acc: any, seriesData: any, index: number) => {
          const columnsBadSeries = {
            ...seriesData,
            title: seriesData.slo_name,
            type: 'column',
            data: [...seriesData?.data].map((dataItem: any[] | null) => {
              if (dataItem?.length) {
                return [
                  dataItem[0],
                  dataItem[2].bad_events === 0 ? null : dataItem[2].bad_events,
                ];
              }
              return [null, null];
            }),
            name: 'Bad events',
            color: '#FF6384',
            id: index.toString(),
          };

          const columnsGoodSeries = {
            ...seriesData,
            title: seriesData.slo_name,
            type: 'column',
            data: [...seriesData?.data].map((dataItem: any[] | null) => {
              if (dataItem?.length) {
                return [
                  dataItem[0],
                  dataItem[2].good_events === 0
                    ? null
                    : dataItem[2].good_events,
                ];
              }
              return [null, null];
            }),
            name: 'Good events',
            color: '#8ec358',
            visible: false,
          };

          return [...acc, columnsBadSeries, columnsGoodSeries];
        },
        [],
      );
      setDataEvents([...eventsData]);
    }
  }, [chartState?.data, serviceState]);

  useEffect(() => {
    const visibility = data.reduce((acc: any, dataSeries: any) => {
      return {
        ...acc,
        [dataSeries?.slo_name ? dataSeries?.slo_name : dataSeries?.title]: true,
      };
    }, {});

    setDataFeaturesVisibility(visibility);

    const updatedErrorBudgetOptions = {
      ...errorBudgetChartOptionsBase,
      series: [...data].map((series: any) => {
        return {
          ...series,
          visible: visibility
            ? visibility[series?.slo_name ? series?.slo_name : series?.name]
            : true,
        };
      }),
      xAxis: {
        ...errorBudgetChartOptionsBase.xAxis,
        plotLines: null,
      },
      service: selectedService,
    };
    setErrorBudgetChartSeries(updatedErrorBudgetOptions);
    setZoomTimeperiod(null);
  }, [data]);

  useEffect(() => {
    const visibility = dataEvents.reduce((acc: any, dataSeries: any) => {
      if (dataSeries?.id) {
        return {
          ...acc,
          [dataSeries.title]: {
            [dataSeries?.name]: true,
          },
        };
      }
      return {
        ...acc,
        [dataSeries.title]: {
          ...acc[dataSeries?.title],
          [dataSeries?.name]: false,
        },
      };
    }, {});

    setEventsVisibility(visibility);
    if (dataFeaturesVisibility && Object.keys(dataFeaturesVisibility)?.length) {
      const updatedEventsChartSeries = Object.keys(
        dataFeaturesVisibility,
      ).reduce((acc, featureName) => {
        const updatedAcc = {
          ...acc,
          [featureName]: {
            ...eventsChartOptionsBase,
            series: [...dataEvents]
              .filter(dataSeries => dataSeries.title === featureName)
              ?.map(series => {
                const updated = {
                  ...series,
                  visible: series?.id ? true : false,
                };
                return updated;
              }),
            service: selectedService,
          },
        };

        return updatedAcc;
      }, {});

      setEventsChartSeries(updatedEventsChartSeries);
    }
  }, [dataEvents]);

  useEffect(() => {
    if (dataFeaturesVisibility && Object.keys(dataFeaturesVisibility)?.length) {
      const updatedEventsChartSeries = Object.keys(
        dataFeaturesVisibility,
      ).reduce((acc, featureName) => {
        const updatedAcc = {
          ...acc,
          [featureName]: {
            ...eventsChartOptionsBase,
            series: zoomTimeperiod
              ? [...(zoomedDataEvents ?? [])]
                  .filter(dataSeries => dataSeries.title === featureName)
                  ?.map(series => {
                    const updated = {
                      ...series,
                      visible: eventsVisibility ? eventsVisibility[featureName][series?.name] : null,
                    };
                    return updated;
                  })
              : [...dataEvents]
                  .filter(dataSeries => dataSeries.title === featureName)
                  ?.map(series => {
                    const updated = {
                      ...series,
                      visible: eventsVisibility
                        ? eventsVisibility[featureName][series?.name]
                        : null,
                    };
                    return updated;
                  }),
            service: selectedService,
          },
        };

        return updatedAcc;
      }, {});

      setEventsChartSeries(updatedEventsChartSeries);
    }
  }, [zoomedDataEvents, eventsVisibility]);

  useEffect(() => {
    if (dataFeaturesVisibility && Object.keys(dataFeaturesVisibility)?.length) {
      // update events data
      const copiedDataEvents = _.cloneDeep(dataEvents);
      const updatedEventsOptions = Object.keys(dataFeaturesVisibility).reduce(
        (acc, featureName) => {
          const updatedAcc = {
            ...acc,
            [featureName]: {
              ...eventsChartOptionsBase,
              series: zoomTimeperiod
                ? [...(zoomedDataEvents ?? [])]
                    ?.filter(dataSeries => dataSeries.title === featureName)
                    ?.map(series => {
                      const updated = {
                        ...series,
                        visible: eventsVisibility
                          ? eventsVisibility[featureName][series?.name]
                          : null,
                      };
                      return updated;
                    })
                : [...copiedDataEvents]
                    .filter(dataSeries => dataSeries.title === featureName)
                    ?.map(series => {
                      const updated = {
                        ...series,
                        visible: eventsVisibility
                          ? eventsVisibility[featureName][series?.name]
                          : null,
                      };
                      return updated;
                    }),
              service: selectedService,
            },
          };
          return updatedAcc;
        },
        {},
      );
      setEventsChartSeries(updatedEventsOptions);

      // update error budgets chart data
      const copiedData = _.cloneDeep(data);
      const updatedErrorBudgetOptions = {
        ...errorBudgetChartOptionsBase,
        series: zoomTimeperiod
          ? [...zoomedData].map(series => {
              return {
                ...series,
                visible: dataFeaturesVisibility
                  ? dataFeaturesVisibility[
                      series?.slo_name ? series?.slo_name : series?.name
                    ]
                  : true,
              };
            })
          : [...copiedData].map(series => {
              return {
                ...series,
                visible: dataFeaturesVisibility
                  ? dataFeaturesVisibility[
                      series?.slo_name ? series?.slo_name : series?.name
                    ]
                  : true,
              };
            }),
        xAxis: {
          ...errorBudgetChartOptionsBase.xAxis,
          plotLines: null,
        },
        service: selectedService,
      };
      setErrorBudgetChartSeries(updatedErrorBudgetOptions);
    }
  }, [zoomedDataEvents, zoomedData, dataFeaturesVisibility]);

  useEffect(() => {
    const updatedErrorBudgetOptions = {
      ...errorBudgetChartOptionsBase,
      series: errorBudgetChartSeries?.series?.map((series: any) => {
        return {
          ...series,
          visible: dataFeaturesVisibility
            ? dataFeaturesVisibility[
                series?.slo_name ? series?.slo_name : series?.name
              ]
            : true,
        };
      }),
      xAxis: {
        ...errorBudgetChartOptionsBase.xAxis,
        plotLines: null,
      },
      service: selectedService,
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
          zoomTimeperiod[1],
        );

        setZoomedDataEvents(filteredEvents);
      }
      if (copiedData) {
        const filteredData = filterDataEvents(
          [...copiedData],
          zoomTimeperiod[0],
          zoomTimeperiod[1],
        );
        setZoomedData([...filteredData]);
      }
    }
  }, [zoomTimeperiod]);

  if (!featuresList?.length) {
    return (
      <div className="mr-5" style={{ width: '100%', height: '190px' }}>
        <p className="text-center text-gray-500 text-xl p-4">
          No SLOs. Add a SLO to start gathering data
        </p>
      </div>
    );
  }

  const clonedOptions = JSON.parse(JSON.stringify(errorBudgetChartSeries));
  if (errorBudgetChartSeries?.chart?.events) {
    clonedOptions.chart.events = errorBudgetChartSeries.chart.events;
    clonedOptions.tooltip.formatter = errorBudgetChartSeries.tooltip.formatter;
    clonedOptions.tooltip.positioner =
      errorBudgetChartSeries.tooltip.positioner;
    clonedOptions.plotOptions = errorBudgetChartSeries.plotOptions;
    clonedOptions.legend = errorBudgetChartSeries.legend;
    clonedOptions.legend.labelFormatter =
      errorBudgetChartSeries.legend.labelFormatter;
    clonedOptions.xAxis.plotLines = deploymentsVisible
      ? zoomTimeperiod
        ? formatPlotLines(deploymentsList, zoomTimeperiod[0], zoomTimeperiod[1])
        : formatPlotLines(
            deploymentsList,
            timeperiod?.date_start * 1000,
            timeperiod?.date_end * 1000,
          )
      : null;
  }

  return (
    <div className="relative">
      <Box
        className="absolute gap-12 "
        sx={{
          height: '42px',
          display: 'flex',
          justifyContent: 'end',
          alignItems: 'center'
        }}
      >
        <Button
          variant="contained"
          onClick={() => {
            setDeploymentsVisible(prevState => !prevState);
          }}
        >
          {deploymentsVisible ? 'Hide' : 'Show'} deployments
        </Button>
        {zoomTimeperiod ? (
          <Button
            variant="outlined"
            onClick={() => {
              setZoomTimeperiod(null);
            }}
          >
            Reset zoom
          </Button>
        ) : null}
      </Box>

      {clonedOptions ? <SyncChart options={clonedOptions} /> : null}

      <div className="mt-4">
        {dataFeaturesVisibility &&
          Object.keys(dataFeaturesVisibility).map((featureName, i) => {
            if (dataFeaturesVisibility[featureName]) {
              return (
                <div key={featureName}>
                  <Box
                    className=""
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '32px',
                      marginTop: '48px',
                    }}
                  >
                    <Typography variant="h6" component="p">
                      {featureName} good/bad events
                    </Typography>
                    {zoomTimeperiod ? (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setZoomTimeperiod(null);
                        }}
                      >
                        Reset zoom
                      </Button>
                    ) : null}
                  </Box>
                  {eventsChartSeries && eventsChartSeries[featureName] ? (
                    <SyncChart options={eventsChartSeries[featureName]} />
                  ) : null}
                </div>
              );
            }
            return null
          })}
      </div>
    </div>
  );
};
