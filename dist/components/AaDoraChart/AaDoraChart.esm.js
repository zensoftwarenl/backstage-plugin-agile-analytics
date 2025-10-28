import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Select, Progress } from '@backstage/core-components';
import InfoRounded from '@material-ui/icons/InfoRounded';

const AaDoraChart = ({
  timeperiod,
  charts,
  chartColor = null,
  customOptions,
  customPointFormatter,
  yAxisType = "linear",
  yAxisFormat = "{value}",
  yAxisFormatter,
  chartHeight,
  loading = false,
  yAxisTitle,
  customOpacity,
  isMarker = true,
  isStacking = true,
  setUpdate = null,
  update = 0
}) => {
  const { date_end, date_start } = timeperiod;
  const [yAxisCustomLabels, setYAxisCustomLabels] = useState({
    format: yAxisFormat
  });
  const [tooltip, setTooltip] = useState({
    shared: false,
    headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><br>'
  });
  const [selectedChart, setSelectedChart] = useState(null);
  const [infoHoverStatus, setInfoHoverStatus] = useState(false);
  useEffect(() => {
    if (charts?.length, update === 0) {
      const formatted = {
        ...charts[0],
        series: formatSeries(charts[0]?.series)
      };
      setSelectedChart(formatted);
    }
  }, [charts, update]);
  useEffect(() => {
    if (yAxisFormatter) {
      setYAxisCustomLabels({ formatter: yAxisFormatter });
    } else {
      setYAxisCustomLabels({
        format: yAxisFormat
      });
    }
  }, [yAxisFormatter, yAxisFormat]);
  useEffect(() => {
    if (customPointFormatter) {
      setTooltip((prevState) => {
        return { ...prevState, pointFormatter: customPointFormatter };
      });
    } else {
      setTooltip({
        shared: true,
        headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><br>'
      });
    }
  }, [customPointFormatter]);
  const selectOptions = charts?.map((chart) => chart.title);
  const options = {
    colors: chartColor ?? ["#7902D7", "#F8C238", "#15A2BB"],
    chart: {
      height: chartHeight
    },
    title: {
      text: ""
    },
    yAxis: {
      labels: yAxisCustomLabels,
      type: yAxisType,
      title: {
        text: yAxisTitle ?? ""
      },
      min: 0
    },
    xAxis: {
      type: "datetime",
      labels: {
        format: "{value:%d %b}",
        align: "right"
      },
      gridLineWidth: 1,
      min: date_start * 1e3,
      max: date_end * 1e3
    },
    credits: {
      enabled: false
    },
    tooltip,
    plotOptions: {
      series: {
        opacity: customOpacity ?? 0.8,
        stickyTracking: false,
        events: {
          mouseOut: function() {
            this.chart.tooltip.hide();
          }
        }
      },
      area: {
        stacking: isStacking ? "normal" : void 0,
        marker: {
          enabled: isMarker,
          states: {
            hover: {
              enabled: isMarker
            }
          }
        }
      },
      column: {
        stacking: isStacking ? "normal" : void 0,
        dataLabels: {
          enabled: true
        }
      },
      line: {
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: false
            }
          }
        },
        lineWidth: 1
      },
      scatter: {
        marker: {
          radius: 6
        }
      },
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.percentage:.1f} %"
        }
      }
    },
    legend: {
      enabled: true
    },
    series: selectedChart?.series ?? [{ data: [null, null] }]
  };
  function formatSeries(series) {
    return series?.map((chart) => {
      return {
        name: chart.name ?? "",
        data: chart.data,
        type: chart.type ?? "area",
        stickyTracking: false
      };
    });
  }
  function handleChartChange(value) {
    if (setUpdate) {
      setUpdate((prevState) => prevState + 1);
    }
    const selected = charts.find(
      (chart) => chart.title.value === value
    );
    if (selected) {
      setSelectedChart({
        ...selected,
        series: formatSeries(selected?.series)
      });
    }
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    charts[0]?.title?.label ? /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          height: 70,
          alignItems: "center",
          paddingLeft: 4,
          paddingRight: 4,
          paddingBottom: 24
        },
        children: [
          charts?.length && charts.length > 1 ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", position: "relative" }, children: [
            /* @__PURE__ */ jsx(
              Select,
              {
                label: "",
                items: selectOptions,
                selected: "cycle-time",
                onChange: (e) => handleChartChange(e.toString())
              }
            ),
            selectedChart?.description ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: { marginTop: 20, marginLeft: 4, cursor: "pointer" },
                  onMouseOver: () => setInfoHoverStatus(true),
                  onFocus: () => setInfoHoverStatus(true),
                  onMouseOut: () => setInfoHoverStatus(false),
                  onBlur: () => setInfoHoverStatus(false),
                  children: /* @__PURE__ */ jsx(InfoRounded, {})
                }
              ),
              infoHoverStatus && /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    top: -4,
                    right: -304,
                    zIndex: 2,
                    fontSize: 12,
                    display: "block",
                    width: 300
                  },
                  children: selectedChart.description
                }
              )
            ] }) : null
          ] }) : null,
          charts?.length && charts.length === 1 ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", position: "relative" }, children: [
            /* @__PURE__ */ jsx("h5", { style: { fontSize: 24, fontWeight: 500 }, children: charts[0].title?.label }),
            charts[0]?.description ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: { marginTop: 20, marginLeft: 4, cursor: "pointer" },
                  onMouseOver: () => setInfoHoverStatus(true),
                  onFocus: () => setInfoHoverStatus(true),
                  onMouseOut: () => setInfoHoverStatus(false),
                  onBlur: () => setInfoHoverStatus(false),
                  children: /* @__PURE__ */ jsx(InfoRounded, {})
                }
              ),
              infoHoverStatus && /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    top: -4,
                    right: -304,
                    zIndex: 2,
                    fontSize: 12,
                    display: "block",
                    width: 300
                  },
                  children: charts[0].description
                }
              )
            ] }) : null
          ] }) : null,
          selectedChart?.averageValue ? /* @__PURE__ */ jsxs("p", { style: { fontSize: 24, fontWeight: 700 }, children: [
            /* @__PURE__ */ jsx("span", { className: "font-display text-lg font-semibold leading-5", children: selectedChart.averageValue }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-display", children: selectedChart?.averageMeasure })
          ] }) : null
        ]
      }
    ) : null,
    loading ? /* @__PURE__ */ jsx(Progress, {}) : /* @__PURE__ */ jsx(
      HighchartsReact,
      {
        highcharts: Highcharts,
        options: customOptions ? customOptions : options
      }
    )
  ] });
};

export { AaDoraChart };
//# sourceMappingURL=AaDoraChart.esm.js.map
