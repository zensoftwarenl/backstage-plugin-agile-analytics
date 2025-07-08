/* eslint-disable no-console */
import React, { useState, useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { DoraChart, DoraSeries, Option, Timeperiod } from '../../api/types';
import { Progress, Select } from '@backstage/core-components';
import InfoRounded from '@material-ui/icons/InfoRounded';


export const AaDoraChart = ({
  timeperiod,
  charts,
  chartColor = null,
  customOptions,
  customPointFormatter,
  yAxisType = 'linear',
  yAxisFormat = '{value}',
  yAxisFormatter,
  chartHeight,
  loading = false,
  yAxisTitle,
  customOpacity,
  isMarker = true,
  isStacking = true,
  setUpdate = null,
  update = 0,
}: {
  timeperiod: Timeperiod;
  charts: any;
  chartColor?: any;
  customOptions?: any;
  customPointFormatter?: any;
  yAxisType?: any;
  yAxisFormat?: string;
  yAxisFormatter?: any;
  chartHeight?: number;
  loading?: boolean;
  className?: string;
  yAxisTitle?: string;
  customOpacity?: number;
  isMarker?: boolean;
  isStacking?: boolean;
  setUpdate?: React.Dispatch<React.SetStateAction<number>> | null;
  update?: number;
}) => {
  const { date_end, date_start } = timeperiod;
  const [yAxisCustomLabels, setYAxisCustomLabels] = useState<{
    formatter?: any;
    format?: any;
  }>({
    format: yAxisFormat,
  });

  const [tooltip, setTooltip] = useState<{
    headerFormat: string;
    shared: boolean;
    pointFormatter?: any;
  }>({
    shared: false,
    headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><br>',
  }); // shared: false -> tooltip will be hidden on mouseout; currently to have shared:false, providing customPointFormatter is required (otherwise it`ll be changed to true (line 69))
  const [selectedChart, setSelectedChart] = useState<any>(null);
  const [infoHoverStatus, setInfoHoverStatus] = useState<boolean>(false);

  useEffect(() => {
    if ((charts?.length, update === 0)) {
      const formatted = {
        ...charts[0],
        series: formatSeries(charts[0]?.series),
      };
      setSelectedChart(formatted);
    }
  }, [charts, update]);

  useEffect(() => {
    if (yAxisFormatter) {
      setYAxisCustomLabels({ formatter: yAxisFormatter });
    } else {
      setYAxisCustomLabels({
        format: yAxisFormat,
      });
    }
  }, [yAxisFormatter, yAxisFormat]);

  useEffect(() => {
    if (customPointFormatter) {
      setTooltip(prevState => {
        return { ...prevState, pointFormatter: customPointFormatter };
      });
    } else {
      setTooltip({
        shared: true,
        headerFormat:
          '<span style="font-size:12px"><b>{point.key}</b></span><br>',
      });
    }
  }, [customPointFormatter]);

  const selectOptions = charts?.map((chart: DoraChart) => chart.title);

  const options: Highcharts.Options = {
    colors: chartColor ?? ['#7902D7', '#F8C238', '#15A2BB'],
    chart: {
      height: chartHeight,
    },
    title: {
      text: '',
    },
    yAxis: {
      labels: yAxisCustomLabels,
      type: yAxisType,
      title: {
        text: yAxisTitle ?? '',
      },
      min: 0,
    },
    xAxis: {
      type: 'datetime',
      labels: {
        format: '{value:%d %b}',
        align: 'right',
      },
      gridLineWidth: 1,
      min: date_start * 1000,
      max: date_end * 1000,
    },
    credits: {
      enabled: false,
    },
    tooltip: tooltip,
    plotOptions: {
      series: {
        opacity: customOpacity ?? 0.8,
        stickyTracking: false,
        events: {
          mouseOut: function () {
            this.chart.tooltip.hide();
          },
        },
      },
      area: {
        stacking: isStacking ? 'normal' : undefined,
        marker: {
          enabled: isMarker,
          states: {
            hover: {
              enabled: isMarker,
            },
          },
        },
      },
      column: {
        stacking: isStacking ? 'normal' : undefined,
        dataLabels: {
          enabled: true,
        },
      },
      line: {
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: false,
            },
          },
        },
        lineWidth: 1,
      },
      scatter: {
        marker: {
          radius: 6,
        },
      },
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %',
        },
      },
    },
    legend: {
      enabled: true,
    },
    series: selectedChart?.series ?? [{ data: [null, null] }],
  };

  function formatSeries(series: DoraSeries[]) {
    return series?.map((chart: DoraSeries) => {
      return {
        name: chart.name ?? '',
        data: chart.data,
        type: chart.type ?? 'area',
        stickyTracking: false,
      };
    });
  }

  function handleChartChange(value: string) {
    if (setUpdate) {
      setUpdate(prevState => prevState + 1);
    }
    const selected = charts.find(
      (chart: DoraChart) => chart.title.value === value,
    );

    if (selected) {
      setSelectedChart({
        ...selected,
        series: formatSeries(selected?.series),
      });
    }
  }

  return (
    <div>
      {charts[0]?.title?.label ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            height: 70,
            alignItems: 'center',
            paddingLeft: 4,
            paddingRight: 4,
            paddingBottom: 24,
          }}
        >
          {charts?.length && charts.length > 1 ? (
            <div style={{ display: 'flex', position: 'relative' }}>
              <Select
                label=""
                items={selectOptions}
                selected="cycle-time"
                onChange={e => handleChartChange(e.toString())}
              />
              {selectedChart?.description ? (
                <>
                  <div
                    style={{ marginTop: 20, marginLeft: 4, cursor: 'pointer' }}
                    onMouseOver={() => setInfoHoverStatus(true)}
                    onFocus={() => setInfoHoverStatus(true)}
                    onMouseOut={() => setInfoHoverStatus(false)}
                    onBlur={() => setInfoHoverStatus(false)}
                  >
                    <InfoRounded />
                  </div>
                  {infoHoverStatus && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -304,
                        zIndex: 2,
                        fontSize: 12,
                        display: 'block',
                        width: 300,
                      }}
                    >
                      {selectedChart.description}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : null}
          {charts?.length && charts.length === 1 ? (
            <div style={{ display: 'flex', position: 'relative' }}>
              <h5 style={{ fontSize: 24, fontWeight: 500 }}>
                {charts[0].title.label}
              </h5>
              {charts[0]?.description ? (
                <>
                  <div
                    style={{ marginTop: 20, marginLeft: 4, cursor: 'pointer' }}
                    onMouseOver={() => setInfoHoverStatus(true)}
                    onFocus={() => setInfoHoverStatus(true)}
                    onMouseOut={() => setInfoHoverStatus(false)}
                    onBlur={() => setInfoHoverStatus(false)}
                  >
                    <InfoRounded />
                  </div>
                  {infoHoverStatus && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -304,
                        zIndex: 2,
                        fontSize: 12,
                        display: 'block',
                        width: 300,
                      }}
                    >
                      {charts[0].description}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : null}
          {selectedChart?.averageValue ? (
            <p style={{ fontSize: 24, fontWeight: 700 }}>
              <span className="font-display text-lg font-semibold leading-5">
                {selectedChart.averageValue}
              </span>{' '}
              <span className="font-display">
                {selectedChart?.averageMeasure}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <Progress />
      ) : (
        <HighchartsReact
          highcharts={Highcharts}
          options={customOptions ? customOptions : options}
        />
      )}
    </div>
  );
};
