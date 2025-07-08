import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Select, Progress, InfoCard, LinearGauge, GaugeCard, Content, Tabs, StructuredMetadataTable, Page, Header, HeaderLabel } from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { g as getStartDate, a as getEndDate, b as agileAnalyticsApiRef, c as getUniqueListByParent, f as filterDataEvents, d as formatPlotLines, e as capitalizeFirstLetter, h as generateErrorBudgetChartOptionsBase, i as generateEventsChartOptionsBase } from './index-36aa4ea7.esm.js';
import { Box, Grid, Chip, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, IconButton, Collapse, Typography, Card, Divider, Button, List, ListItem } from '@material-ui/core';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import InfoRounded from '@material-ui/icons/InfoRounded';
import moment from 'moment';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import CheckCircleOutlineOutlinedIcon from '@material-ui/icons/CheckCircleOutlineRounded';
import HighlightOff from '@material-ui/icons/HighlightOff';
import _ from 'lodash';
import { init } from 'emoji-mart';
import data from '@emoji-mart/data';
import Box$1 from '@material-ui/core/Box';
import Chart from 'react-google-charts';

const AaTimeSelect = ({
  timeperiod,
  setTimeperiod
}) => {
  const timeSelect = [
    {
      date_start: getStartDate(6, "days"),
      date_end: getEndDate(),
      label: "Last 7 days",
      value: "7days"
    },
    {
      date_start: getStartDate(13, "days"),
      date_end: getEndDate(),
      label: "Last 14 days",
      value: "14days"
    },
    {
      date_start: getStartDate(2, "months"),
      date_end: getEndDate(),
      label: "Last 2 months",
      value: "2months"
    },
    {
      date_start: getStartDate(3, "months"),
      date_end: getEndDate(),
      label: "Last 3 months",
      value: "3months"
    }
  ];
  function handleTimeperiodChange(value) {
    const updatedTimeperiod = timeSelect.find((period) => period.value === value);
    if (updatedTimeperiod) {
      setTimeperiod(updatedTimeperiod);
    }
  }
  return /* @__PURE__ */ React.createElement(Box, {
    sx: { display: "flex" }
  }, /* @__PURE__ */ React.createElement(Box, {
    sx: { minWidth: "260px", marginRight: "24px" }
  }, /* @__PURE__ */ React.createElement(Select, {
    label: "Timeperiod",
    items: timeSelect,
    selected: "7days",
    onChange: (e) => handleTimeperiodChange(e.toString())
  })));
};

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
  var _a, _b, _c, _d;
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
    var _a2;
    if (charts == null ? void 0 : charts.length, update === 0) {
      const formatted = {
        ...charts[0],
        series: formatSeries((_a2 = charts[0]) == null ? void 0 : _a2.series)
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
  const selectOptions = charts == null ? void 0 : charts.map((chart) => chart.title);
  const options = {
    colors: chartColor != null ? chartColor : ["#7902D7", "#F8C238", "#15A2BB"],
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
        text: yAxisTitle != null ? yAxisTitle : ""
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
        opacity: customOpacity != null ? customOpacity : 0.8,
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
    series: (_a = selectedChart == null ? void 0 : selectedChart.series) != null ? _a : [{ data: [null, null] }]
  };
  function formatSeries(series) {
    return series == null ? void 0 : series.map((chart) => {
      var _a2, _b2;
      return {
        name: (_a2 = chart.name) != null ? _a2 : "",
        data: chart.data,
        type: (_b2 = chart.type) != null ? _b2 : "area",
        stickyTracking: false
      };
    });
  }
  function handleChartChange(value) {
    if (setUpdate) {
      setUpdate((prevState) => prevState + 1);
    }
    const selected = charts.find((chart) => chart.title.value === value);
    if (selected) {
      setSelectedChart({
        ...selected,
        series: formatSeries(selected == null ? void 0 : selected.series)
      });
    }
  }
  return /* @__PURE__ */ React.createElement("div", null, ((_c = (_b = charts[0]) == null ? void 0 : _b.title) == null ? void 0 : _c.label) ? /* @__PURE__ */ React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      height: 70,
      alignItems: "center",
      paddingLeft: 4,
      paddingRight: 4,
      paddingBottom: 24
    }
  }, (charts == null ? void 0 : charts.length) && charts.length > 1 ? /* @__PURE__ */ React.createElement("div", {
    style: { display: "flex", position: "relative" }
  }, /* @__PURE__ */ React.createElement(Select, {
    label: "",
    items: selectOptions,
    selected: "cycle-time",
    onChange: (e) => handleChartChange(e.toString())
  }), (selectedChart == null ? void 0 : selectedChart.description) ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", {
    style: { marginTop: 20, marginLeft: 4, cursor: "pointer" },
    onMouseOver: () => setInfoHoverStatus(true),
    onFocus: () => setInfoHoverStatus(true),
    onMouseOut: () => setInfoHoverStatus(false),
    onBlur: () => setInfoHoverStatus(false)
  }, /* @__PURE__ */ React.createElement(InfoRounded, null)), infoHoverStatus && /* @__PURE__ */ React.createElement("div", {
    style: {
      position: "absolute",
      top: -4,
      right: -304,
      zIndex: 2,
      fontSize: 12,
      display: "block",
      width: 300
    }
  }, selectedChart.description)) : null) : null, (charts == null ? void 0 : charts.length) && charts.length === 1 ? /* @__PURE__ */ React.createElement("div", {
    style: { display: "flex", position: "relative" }
  }, /* @__PURE__ */ React.createElement("h5", {
    style: { fontSize: 24, fontWeight: 500 }
  }, charts[0].title.label), ((_d = charts[0]) == null ? void 0 : _d.description) ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", {
    style: { marginTop: 20, marginLeft: 4, cursor: "pointer" },
    onMouseOver: () => setInfoHoverStatus(true),
    onFocus: () => setInfoHoverStatus(true),
    onMouseOut: () => setInfoHoverStatus(false),
    onBlur: () => setInfoHoverStatus(false)
  }, /* @__PURE__ */ React.createElement(InfoRounded, null)), infoHoverStatus && /* @__PURE__ */ React.createElement("div", {
    style: {
      position: "absolute",
      top: -4,
      right: -304,
      zIndex: 2,
      fontSize: 12,
      display: "block",
      width: 300
    }
  }, charts[0].description)) : null) : null, (selectedChart == null ? void 0 : selectedChart.averageValue) ? /* @__PURE__ */ React.createElement("p", {
    style: { fontSize: 24, fontWeight: 700 }
  }, /* @__PURE__ */ React.createElement("span", {
    className: "font-display text-lg font-semibold leading-5"
  }, selectedChart.averageValue), " ", /* @__PURE__ */ React.createElement("span", {
    className: "font-display"
  }, selectedChart == null ? void 0 : selectedChart.averageMeasure)) : null) : null, loading ? /* @__PURE__ */ React.createElement(Progress, null) : /* @__PURE__ */ React.createElement(HighchartsReact, {
    highcharts: Highcharts,
    options: customOptions ? customOptions : options
  }));
};

const AaDoraPage = ({ timeperiod }) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const reposState = useAsync(async () => {
    const response = await api.getReposData({
      orgHash,
      apiKey
    });
    return response;
  }, []);
  const [repositoriesFilter, setRepositoriesFilter] = useState([]);
  const [update, setUpdate] = useState(0);
  useEffect(() => {
    var _a;
    if ((_a = reposState == null ? void 0 : reposState.value) == null ? void 0 : _a.length) {
      const formatted = reposState == null ? void 0 : reposState.value.reduce((acc, item) => {
        const group = item.provider_id;
        const options = item.repositories.map((repository) => {
          var _a2;
          return {
            ...repository,
            group,
            isSelected: (_a2 = repository == null ? void 0 : repository.webhook) != null ? _a2 : false
          };
        });
        return [...acc, ...options];
      }, []).filter((repo) => repo.webhook);
      setRepositoriesFilter(formatted);
    } else {
      setRepositoriesFilter([]);
    }
  }, [reposState.value]);
  const [timeperiodByDays, setTimeperiodByDays] = useState([]);
  useEffect(() => {
    if (timeperiod.date_start && timeperiod.date_end) {
      const timestampsByDays = [];
      let dayStartTimestamp = timeperiod.date_start * 1e3;
      let dayEndTimestamp = +moment(dayStartTimestamp).add(1, "days").subtract(1, "seconds").format("x");
      while (dayEndTimestamp < timeperiod.date_end * 1e3) {
        timestampsByDays.push({
          start: dayStartTimestamp,
          end: dayEndTimestamp
        });
        dayStartTimestamp = +moment(dayStartTimestamp).add(1, "days").format("x");
        dayEndTimestamp = +moment(dayEndTimestamp).add(1, "days").format("x");
      }
      timestampsByDays.push({
        start: dayStartTimestamp,
        end: dayEndTimestamp
      });
      setTimeperiodByDays(timestampsByDays);
    }
  }, [timeperiod]);
  const deploymentFreqState = useAsync(async () => {
    const response = await api.getDeploymentFreqData({
      orgHash,
      apiKey,
      dateStart: timeperiod == null ? void 0 : timeperiod.date_start,
      dateEnd: timeperiod == null ? void 0 : timeperiod.date_end
    });
    return response;
  }, [timeperiod]);
  const [filteredDeploymentFreqData, setFilteredDeploymentFreqData] = useState([]);
  const [formattedDeploymentFreqData, setFormattedDeploymentFreqData] = useState([]);
  const [
    formattedDeploymentFreqSuccessData,
    setFormattedDeploymentFreqSuccessData
  ] = useState([]);
  const [
    formattedDeploymentFreqFailedData,
    setFormattedDeploymentFreqFailedData
  ] = useState([]);
  const [averageDeploymentFreq, setAverageDeploymentFreq] = useState(null);
  const chartsDeploymentFreq = [
    {
      title: {
        label: "Deployment frequency",
        value: "deployment-frequency"
      },
      averageMeasure: "p/day",
      averageValue: averageDeploymentFreq,
      series: [
        {
          name: "Successful deployments",
          data: formattedDeploymentFreqSuccessData ? formattedDeploymentFreqSuccessData : []
        },
        {
          name: "Failed deployments",
          data: formattedDeploymentFreqFailedData ? formattedDeploymentFreqFailedData : []
        }
      ]
    }
  ];
  const filterDeploymentFreq = useCallback((data) => {
    const filteredData = data.filter((deployment) => {
      return repositoriesFilter.find((repo) => {
        var _a;
        return repo.isSelected && repo.url.includes((_a = deployment == null ? void 0 : deployment.repository) == null ? void 0 : _a.replace("git@gitlab.com:", ""));
      });
    });
    return filteredData;
  }, [repositoriesFilter]);
  useEffect(() => {
    var _a;
    if ((_a = deploymentFreqState == null ? void 0 : deploymentFreqState.value) == null ? void 0 : _a.length) {
      const filteredData = filterDeploymentFreq(deploymentFreqState.value);
      setFilteredDeploymentFreqData(filteredData);
    } else {
      setFilteredDeploymentFreqData([]);
    }
  }, [deploymentFreqState, filterDeploymentFreq]);
  const formatDeploymentFreq = useCallback((status = "success") => {
    return timeperiodByDays.reduce((acc, day, i) => {
      let deployments = filteredDeploymentFreqData.filter((deployment) => deployment.timestamp * 1e3 >= day.start && deployment.timestamp * 1e3 <= day.end);
      if (status) {
        deployments = deployments.filter((deployment) => deployment.status === status);
      }
      if (i === (timeperiodByDays == null ? void 0 : timeperiodByDays.length) - 1) {
        return [
          ...acc,
          [day.start, deployments.length],
          [day.end, deployments.length]
        ];
      }
      return [...acc, [day.start, deployments.length]];
    }, []);
  }, [filteredDeploymentFreqData, timeperiodByDays]);
  useEffect(() => {
    if (filteredDeploymentFreqData == null ? void 0 : filteredDeploymentFreqData.length) {
      setFormattedDeploymentFreqSuccessData(formatDeploymentFreq("success"));
      setFormattedDeploymentFreqFailedData(formatDeploymentFreq("failed"));
      setFormattedDeploymentFreqData(formatDeploymentFreq());
    } else {
      setFormattedDeploymentFreqSuccessData([]);
      setFormattedDeploymentFreqFailedData([]);
      setFormattedDeploymentFreqData([]);
    }
  }, [filteredDeploymentFreqData == null ? void 0 : filteredDeploymentFreqData.length, formatDeploymentFreq]);
  useEffect(() => {
    if (formattedDeploymentFreqData == null ? void 0 : formattedDeploymentFreqData.length) {
      const totalDeployments = formattedDeploymentFreqData.reduce((acc, item, i) => formattedDeploymentFreqData.length - 1 !== i ? acc + item[1] : acc, 0);
      const avgDeployments = (totalDeployments / timeperiodByDays.length).toFixed(2);
      setAverageDeploymentFreq(avgDeployments);
    } else {
      setAverageDeploymentFreq(null);
    }
  }, [formattedDeploymentFreqData, timeperiodByDays, repositoriesFilter]);
  function handleRepoToggle(repo) {
    const updatedRepos = repositoriesFilter.map((filterRepo) => {
      if (filterRepo.url === repo.url) {
        return { ...filterRepo, isSelected: !filterRepo.isSelected };
      }
      return filterRepo;
    });
    setRepositoriesFilter(updatedRepos);
  }
  const leadTimeState = useAsync(async () => {
    const response = await api.getLeadTimeData({
      orgHash,
      apiKey,
      dateStart: timeperiod == null ? void 0 : timeperiod.date_start,
      dateEnd: timeperiod == null ? void 0 : timeperiod.date_end
    });
    return response;
  }, [timeperiod]);
  const [filteredLeadTimeData, setFilteredLeadTimeData] = useState([]);
  const [formattedLeadTimeData, setFormattedLeadTimeData] = useState([]);
  const [ticketKeys, setTicketKeys] = useState([]);
  const [formattedLeadTimeForChangeData, setFormattedLeadTimeForChangeData] = useState([]);
  const [formattedCycleTimeData, setFormattedCycleTimeData] = useState([]);
  const [averageCycleTimeChartData, setAverageCycleTimeChartData] = useState([]);
  const [averageLeadTimeChartData, setAverageLeadTimeChartData] = useState([]);
  const [
    averageLeadTimeForChangeChartData,
    setAverageLeadTimeForChangeChartData
  ] = useState([]);
  const [averageCycleTime, setAverageCycleTime] = useState(null);
  const chartsLeadTime = [
    {
      title: {
        value: "cycle-time",
        label: "Cycle Time"
      },
      description: "Measures the time difference between the starting time of implementing a requirement and when the changes are delivered to production.",
      averageMeasure: "",
      averageValue: averageCycleTime == null ? void 0 : averageCycleTime.cycleTime,
      series: [
        {
          name: "Deployments Cycle Time",
          type: "scatter",
          data: (formattedCycleTimeData == null ? void 0 : formattedCycleTimeData.length) ? formattedCycleTimeData : []
        },
        {
          name: "Average",
          type: "line",
          data: (averageCycleTimeChartData == null ? void 0 : averageCycleTimeChartData.length) ? averageCycleTimeChartData : []
        }
      ]
    },
    {
      title: {
        value: "lead-time",
        label: "Lead Time"
      },
      description: "Measures the time difference between the time a requirement is created and when the changes are delivered to production.",
      averageMeasure: "",
      averageValue: averageCycleTime == null ? void 0 : averageCycleTime.leadTime,
      series: [
        {
          name: "Deployments Lead Time",
          type: "scatter",
          data: formattedLeadTimeData.length ? formattedLeadTimeData : []
        },
        {
          name: "Average",
          type: "line",
          data: averageLeadTimeChartData.length ? averageLeadTimeChartData : []
        }
      ]
    },
    {
      title: {
        value: "lead-time-for-change",
        label: "Lead Time for Changes"
      },
      description: "Measures the amount of time it takes a commit to get into production.",
      averageMeasure: "",
      averageValue: averageCycleTime == null ? void 0 : averageCycleTime.leadTimeForChange,
      series: [
        {
          name: "Deployments Lead Time For Changes",
          type: "scatter",
          data: formattedLeadTimeForChangeData.length ? formattedLeadTimeForChangeData : []
        },
        {
          name: "Average",
          type: "line",
          data: averageLeadTimeForChangeChartData.length ? averageLeadTimeForChangeChartData : []
        }
      ]
    }
  ];
  useEffect(() => {
    var _a;
    if ((_a = leadTimeState == null ? void 0 : leadTimeState.value) == null ? void 0 : _a.length) {
      const filteredData = filterDeploymentFreq(leadTimeState.value);
      setFilteredLeadTimeData(filteredData);
    } else {
      setFilteredLeadTimeData([]);
    }
  }, [leadTimeState == null ? void 0 : leadTimeState.value, repositoriesFilter, filterDeploymentFreq]);
  const formatLeadTimeData = useCallback((propertyKey) => {
    return filteredLeadTimeData.map((deployment) => [
      deployment.timestamp * 1e3,
      deployment[propertyKey] * 1e3
    ]);
  }, [filteredLeadTimeData]);
  useEffect(() => {
    if (filteredLeadTimeData == null ? void 0 : filteredLeadTimeData.length) {
      setFormattedLeadTimeData(formatLeadTimeData("lead_time"));
      setFormattedCycleTimeData(formatLeadTimeData("cycle_time"));
      setFormattedLeadTimeForChangeData(formatLeadTimeData("lead_time_for_changes"));
      setTicketKeys(filteredLeadTimeData.map((item) => item.key));
    } else {
      setFormattedLeadTimeData([]);
      setFormattedCycleTimeData([]);
      setFormattedLeadTimeForChangeData([]);
      setTicketKeys([]);
    }
  }, [filteredLeadTimeData, formatLeadTimeData, update]);
  const generateAverageChart = useCallback((formattedData) => {
    return timeperiodByDays.reduce((acc, day, i) => {
      const dayDeployments = formattedData.filter((deployment) => deployment[0] >= day.start && deployment[0] <= day.end);
      const dayAverage = (dayDeployments == null ? void 0 : dayDeployments.length) ? dayDeployments.reduce((accum, event) => accum + event[1], 0) / (dayDeployments == null ? void 0 : dayDeployments.length) : null;
      if (!dayAverage) {
        if (i === (timeperiodByDays == null ? void 0 : timeperiodByDays.length) - 1 && (acc == null ? void 0 : acc.length)) {
          return [...acc, [day.end, acc[acc.length - 1][1]]];
        }
        return acc;
      }
      if (!(acc == null ? void 0 : acc.length)) {
        return [
          ...acc,
          [timeperiodByDays[0].start, dayAverage],
          [day.end, dayAverage]
        ];
      }
      return [...acc, [day.end, dayAverage]];
    }, []);
  }, [timeperiodByDays]);
  const formatChartAxisTime = useCallback((value) => {
    const valueDuration = moment.duration(value);
    let formattedValue = "0";
    if (value !== 0) {
      if (valueDuration._data.months) {
        formattedValue = `${Math.floor(valueDuration.asDays())}d`;
      } else if (valueDuration._data.days) {
        formattedValue = `${valueDuration._data.days}d ${valueDuration._data.minutes >= 30 ? valueDuration._data.hours + 1 : valueDuration._data.hours}h`;
      } else if (valueDuration._data.hours) {
        formattedValue = `${valueDuration._data.hours}h ${valueDuration._data.seconds >= 30 ? valueDuration._data.minutes + 1 : valueDuration._data.minutes}m`;
      } else if (valueDuration._data.minutes) {
        formattedValue = `${valueDuration._data.minutes}m ${valueDuration._data.milliseconds >= 30 ? valueDuration._data.seconds + 1 : valueDuration._data.seconds}s`;
      } else if (valueDuration._data.seconds) {
        formattedValue = `${valueDuration._data.milliseconds >= 30 ? valueDuration._data.seconds + 1 : valueDuration._data.seconds}s`;
      }
    }
    return formattedValue;
  }, []);
  useEffect(() => {
    let avgCycleTime = null;
    let avgLeadTime = null;
    let avgLeadTimeForChange = null;
    const totalCycleTime = (formattedCycleTimeData == null ? void 0 : formattedCycleTimeData.length) ? formattedCycleTimeData.reduce((acc, item) => acc + item[1], 0) : null;
    const totalLeadTime = (formattedLeadTimeData == null ? void 0 : formattedLeadTimeData.length) ? formattedLeadTimeData.reduce((acc, item) => acc + item[1], 0) : null;
    const totalLeadTimeForChange = (formattedLeadTimeForChangeData == null ? void 0 : formattedLeadTimeForChangeData.length) ? formattedLeadTimeForChangeData.reduce((acc, item) => acc + item[1], 0) : null;
    if (totalCycleTime) {
      avgCycleTime = formatChartAxisTime(totalCycleTime / formattedCycleTimeData.length);
    }
    if (totalLeadTime) {
      avgLeadTime = formatChartAxisTime(totalLeadTime / formattedLeadTimeData.length);
    }
    if (totalLeadTimeForChange) {
      avgLeadTimeForChange = formatChartAxisTime(totalLeadTimeForChange / formattedLeadTimeForChangeData.length);
    }
    setAverageCycleTime({
      cycleTime: avgCycleTime,
      leadTime: avgLeadTime,
      leadTimeForChange: avgLeadTimeForChange
    });
    setAverageCycleTimeChartData(generateAverageChart(formattedCycleTimeData));
    setAverageLeadTimeChartData(generateAverageChart(formattedLeadTimeData));
    setAverageLeadTimeForChangeChartData(generateAverageChart(formattedLeadTimeForChangeData));
  }, [
    formattedLeadTimeData,
    formattedCycleTimeData,
    formattedLeadTimeForChangeData,
    generateAverageChart,
    formatChartAxisTime
  ]);
  if (reposState == null ? void 0 : reposState.loading) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if (reposState == null ? void 0 : reposState.error) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, reposState == null ? void 0 : reposState.error.message);
  }
  return /* @__PURE__ */ React.createElement(InfoCard, {
    title: "DORA Metrics"
  }, /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 3,
    alignItems: "stretch"
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 4,
    lg: 2
  }, /* @__PURE__ */ React.createElement(InfoCard, {
    title: "Repositories"
  }, repositoriesFilter.filter((repo) => repo.isSelected).map((repo) => /* @__PURE__ */ React.createElement(Chip, {
    label: repo.name,
    key: repo.url,
    size: "small",
    onDelete: () => handleRepoToggle(repo)
  })), repositoriesFilter.filter((repo) => !repo.isSelected).map((repo) => /* @__PURE__ */ React.createElement(Chip, {
    label: repo.name,
    key: repo.url,
    size: "small",
    variant: "outlined",
    onClick: () => handleRepoToggle(repo)
  })))), /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 8,
    lg: 10
  }, /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 3
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 12,
    lg: 6
  }, /* @__PURE__ */ React.createElement(AaDoraChart, {
    timeperiod,
    charts: chartsDeploymentFreq,
    chartColor: ["#3090B3", "#FFA1B5"],
    chartHeight: 360,
    loading: deploymentFreqState.loading,
    customPointFormatter: null,
    customOptions: null,
    yAxisFormatter: null
  })), /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 12,
    lg: 6
  }, /* @__PURE__ */ React.createElement(AaDoraChart, {
    timeperiod,
    charts: chartsLeadTime,
    chartColor: ["#FF6384", "#333333"],
    yAxisFormatter: function() {
      const formattedValue = formatChartAxisTime(this.value);
      return `<span>${formattedValue}</span>`;
    },
    chartHeight: 360,
    customPointFormatter: function() {
      const formattedValue = formatChartAxisTime(this.options.y);
      const keyIndex = formattedCycleTimeData.findIndex((item) => item[0] === this.options.x);
      return `<span>${this.series.userOptions.name.replace("Deployments ", "")}: ${formattedValue}</span><br/><span>${this.series.initialType === "scatter" ? `Ticket key: ${ticketKeys[keyIndex]}` : ""}`;
    },
    loading: leadTimeState.loading,
    customOptions: null,
    setUpdate,
    update
  }))))));
};

const AaSprintInsightsTable = ({
  timeperiod,
  tickets
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  const latestTasksWithUniqueParent = getUniqueListByParent(tickets).sort((a, b) => b.timestamp - a.timestamp);
  const parentTaskWithSubTasks = latestTasksWithUniqueParent.map((uniqueTask) => {
    let parentTaskWithLatestTimestamp = { ...uniqueTask, isParent: true };
    const parentTasksUpdates = tickets.filter((task) => task.key === uniqueTask.parent.key).sort((a, b) => b.timestamp - a.timestamp);
    if (parentTasksUpdates.length) {
      const parentTask = parentTasksUpdates[0];
      parentTaskWithLatestTimestamp = {
        ...parentTask,
        timestamp: uniqueTask.timestamp,
        isParent: true
      };
    }
    const allSubtasks = tickets.filter((task) => task.parent.key === uniqueTask.parent.key);
    return { ...parentTaskWithLatestTimestamp, subtasks: [...allSubtasks] };
  });
  const formattedTableData = parentTaskWithSubTasks.map((ticket) => {
    var _a, _b, _c;
    const formattedTicket = {
      "date event": ticket.timestamp,
      "transition from": ticket.transition_from,
      "transition to": ticket.transition_to,
      sprint: (_a = ticket.sprint) != null ? _a : "",
      "ticket key": ticket.key,
      type: ticket.type,
      summary: ticket.summary,
      hours: ticket.hours,
      label: (_b = ticket.parent.label.split(" ").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")) != null ? _b : "",
      confidence: +ticket.parent.predictions[0].value,
      subtasks: ((_c = ticket == null ? void 0 : ticket.subtasks) == null ? void 0 : _c.length) ? ticket.subtasks.map((subtask) => {
        var _a2;
        return {
          "date event": subtask.timestamp,
          "transition from": subtask.transition_from,
          "transition to": subtask.transition_to,
          sprint: (_a2 = subtask.sprint) != null ? _a2 : "",
          "ticket key": subtask.key,
          type: subtask.type,
          summary: subtask.summary,
          hours: subtask.hours,
          label: "",
          confidence: +ticket.parent.predictions[0].value
        };
      }) : null
    };
    return formattedTicket;
  });
  return /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 12
  }, /* @__PURE__ */ React.createElement(TableContainer, null, /* @__PURE__ */ React.createElement(Table, {
    "aria-label": "collapsible table"
  }, /* @__PURE__ */ React.createElement(TableHead, null, /* @__PURE__ */ React.createElement(TableRow, null, /* @__PURE__ */ React.createElement(TableCell, {
    padding: "normal"
  }), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "none"
  }, "Date Event"), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "normal"
  }, "From"), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "none"
  }, "To"), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "normal"
  }, "Sprint"), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "none"
  }, "Ticket key"), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "normal"
  }, "Type"), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "none",
    size: "medium"
  }, "Description"), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "normal"
  }, "Hours"), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "none"
  }, "Label"), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "normal"
  }, "Confidence"))), /* @__PURE__ */ React.createElement(TableBody, null, formattedTableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, i) => /* @__PURE__ */ React.createElement(Row, {
    key: row["date event"],
    row
  }))))), /* @__PURE__ */ React.createElement(TablePagination, {
    rowsPerPageOptions: [10, 25, 100],
    component: "div",
    count: formattedTableData.length,
    rowsPerPage,
    page,
    onPageChange: handleChangePage,
    onRowsPerPageChange: handleChangeRowsPerPage
  }));
};
function Row(props) {
  var _a;
  const { row } = props;
  const [open, setOpen] = React.useState(false);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TableRow, null, /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "3%", paddingTop: 4, paddingBottom: 4 }
  }, /* @__PURE__ */ React.createElement(IconButton, {
    onClick: () => setOpen(!open)
  }, open ? /* @__PURE__ */ React.createElement(KeyboardArrowUp, null) : /* @__PURE__ */ React.createElement(KeyboardArrowDown, null))), /* @__PURE__ */ React.createElement(TableCell, {
    padding: "none",
    component: "th",
    scope: "row",
    style: { width: "10%", paddingTop: 4, paddingBottom: 4 }
  }, row["date event"]), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 }
  }, row["transition from"]), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
    padding: "none"
  }, row["transition to"]), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "8%", paddingTop: 4, paddingBottom: 4 }
  }, row.sprint), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
    padding: "none"
  }, row["ticket key"]), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 }
  }, row.type), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "30%", paddingTop: 4, paddingBottom: 4 },
    padding: "none",
    size: "medium"
  }, row.summary), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "5%", paddingTop: 4, paddingBottom: 4 }
  }, row.hours), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
    padding: "none"
  }, row.label), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "9%", paddingTop: 4, paddingBottom: 4 }
  }, /* @__PURE__ */ React.createElement(LinearGauge, {
    value: row.confidence
  }))), /* @__PURE__ */ React.createElement(TableRow, null, /* @__PURE__ */ React.createElement(TableCell, {
    style: {
      paddingBottom: 0,
      paddingTop: 0,
      paddingLeft: 0,
      paddingRight: 0
    },
    colSpan: 12
  }, /* @__PURE__ */ React.createElement(Collapse, {
    in: open,
    timeout: "auto",
    unmountOnExit: true
  }, /* @__PURE__ */ React.createElement(Table, null, /* @__PURE__ */ React.createElement(TableBody, null, (_a = row == null ? void 0 : row.subtasks) == null ? void 0 : _a.map((subtask) => /* @__PURE__ */ React.createElement(TableRow, {
    key: subtask["ticket key"]
  }, /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "3%", paddingTop: 4, paddingBottom: 4 }
  }, /* @__PURE__ */ React.createElement("div", {
    style: { width: 48, opacity: 0 }
  }, " test")), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "10%", paddingTop: 4, paddingBottom: 4 },
    padding: "none",
    component: "th",
    scope: "row"
  }, subtask["date event"]), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 }
  }, subtask["transition from"]), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
    padding: "none"
  }, subtask["transition to"]), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "8%", paddingTop: 4, paddingBottom: 4 }
  }, subtask.sprint), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
    padding: "none"
  }, subtask["ticket key"]), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 }
  }, subtask.type), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "30%", paddingTop: 4, paddingBottom: 4 },
    padding: "none",
    size: "medium"
  }, subtask.summary), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "5%", paddingTop: 4, paddingBottom: 4 }
  }, subtask.hours), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
    padding: "none"
  }, row.label), /* @__PURE__ */ React.createElement(TableCell, {
    style: { width: "9%", paddingTop: 4, paddingBottom: 4 }
  }, /* @__PURE__ */ React.createElement(LinearGauge, {
    value: row.confidence
  }))))))))));
}

const AaSprintInsightsPage = ({
  timeperiod
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const siState = useAsync(async () => {
    const response = await api.getSiData({
      orgHash,
      apiKey,
      dateStart: timeperiod == null ? void 0 : timeperiod.date_start,
      dateEnd: timeperiod == null ? void 0 : timeperiod.date_end
    });
    return response;
  }, [timeperiod]);
  if (siState == null ? void 0 : siState.loading) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if (siState == null ? void 0 : siState.error) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, siState == null ? void 0 : siState.error.message);
  }
  const ticketsTotal = siState.value.featuresAmount + siState.value.notFeaturesAmount;
  const featuresPart = siState.value.featuresAmount / ticketsTotal;
  const notFeaturesPart = siState.value.notFeaturesAmount / ticketsTotal;
  const timeTotal = siState.value.featuresTime + siState.value.notFeaturesTime;
  const featuresTimePart = siState.value.featuresTime / timeTotal;
  const notFeaturesTimePart = siState.value.notFeaturesTime / timeTotal;
  return /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 2
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true
  }, /* @__PURE__ */ React.createElement(InfoCard, {
    title: "Feature - not feature",
    subheader: "How many features and not-feature tasks are in development"
  }, /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 2
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true
  }, /* @__PURE__ */ React.createElement(GaugeCard, {
    title: "Features",
    progress: featuresPart,
    description: `${siState.value.featuresAmount} tickets`
  })), /* @__PURE__ */ React.createElement(Grid, {
    item: true
  }, /* @__PURE__ */ React.createElement(GaugeCard, {
    title: "Not features",
    progress: notFeaturesPart,
    description: `${siState.value.notFeaturesAmount} tickets`
  }))))), /* @__PURE__ */ React.createElement(Grid, {
    item: true
  }, /* @__PURE__ */ React.createElement(InfoCard, {
    title: "Time spent",
    subheader: "How much time were spent on features and not-feature tasks"
  }, /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 2
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true
  }, /* @__PURE__ */ React.createElement(GaugeCard, {
    title: "Features",
    progress: featuresTimePart,
    description: `${siState.value.featuresTime} hours spent`
  })), /* @__PURE__ */ React.createElement(Grid, {
    item: true
  }, /* @__PURE__ */ React.createElement(GaugeCard, {
    title: "Not features",
    progress: notFeaturesTimePart,
    description: `${siState.value.notFeaturesTime} hours spent`
  }))))), /* @__PURE__ */ React.createElement(AaSprintInsightsTable, {
    timeperiod,
    tickets: siState.value.tickets
  }));
};

const AaStockPage = ({ timeperiod }) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const stockState = useAsync(async () => {
    const response = await api.getStockData({
      orgHash,
      apiKey,
      dateStart: timeperiod == null ? void 0 : timeperiod.date_start,
      dateEnd: timeperiod == null ? void 0 : timeperiod.date_end
    });
    return response;
  }, [timeperiod]);
  const riskChartState = useAsync(async () => {
    const response = await api.getRiskChartData({
      orgHash,
      apiKey,
      dateStart: timeperiod == null ? void 0 : timeperiod.date_start,
      dateEnd: timeperiod == null ? void 0 : timeperiod.date_end
    });
    return response;
  }, [timeperiod]);
  const createChartSeriesFromData = () => {
    const getLabels = (buckets) => {
      if (!buckets) {
        return [];
      }
      const labels = [];
      const timestamps = Object.keys(buckets);
      if (!timestamps.length) {
        return [];
      }
      timestamps.forEach((item) => {
        const start_date = moment(item).unix();
        labels.push(start_date);
      });
      return labels;
    };
    const series = (stockState == null ? void 0 : stockState.value) ? Object.keys(stockState == null ? void 0 : stockState.value).filter((item) => item !== "buckets").reduce((acc, item) => {
      var _a;
      const formatted = {
        name: item,
        data: getLabels((_a = stockState.value) == null ? void 0 : _a.buckets).map((date, i) => {
          var _a2;
          return [
            date * 1e3,
            (_a2 = stockState.value[item][i]) == null ? void 0 : _a2.avg_branch_total_modified_lines
          ];
        }),
        type: "column"
      };
      return [...acc, formatted];
    }, []) : [];
    return series;
  };
  const createRiskChartSeriesFromData = () => {
    if (!(riskChartState == null ? void 0 : riskChartState.value)) {
      return [];
    }
    const series = [
      {
        name: "",
        data: Object.entries(riskChartState == null ? void 0 : riskChartState.value).map((entry) => {
          return [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]];
        }),
        type: "pie"
      }
    ];
    return series;
  };
  const chartOptions = [
    {
      series: createChartSeriesFromData()
    }
  ];
  const riskChartOptions = [
    {
      series: createRiskChartSeriesFromData()
    }
  ];
  if (stockState == null ? void 0 : stockState.loading) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if (stockState == null ? void 0 : stockState.error) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, stockState == null ? void 0 : stockState.error.message);
  }
  return /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 2
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 12,
    lg: 8
  }, /* @__PURE__ */ React.createElement(InfoCard, {
    title: "Stock"
  }, /* @__PURE__ */ React.createElement(AaDoraChart, {
    timeperiod,
    charts: chartOptions,
    chartColor: [
      "#15a2bb",
      "#54afc4",
      "#79bccd",
      "#99c9d6",
      "#b7d6df",
      "#d4e3e8",
      "#f1f1f1",
      "#f7dbde",
      "#fcc5cb",
      "#ffaeb9",
      "#ff97a7",
      "#ff7e95",
      "#ff6384"
    ],
    loading: stockState.loading,
    customPointFormatter: null,
    customOptions: null,
    yAxisFormatter: null,
    yAxisTitle: "Average number of modified lines",
    customOpacity: 1
  }))), /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 12,
    lg: 4
  }, /* @__PURE__ */ React.createElement(InfoCard, {
    title: "Risk Chart",
    deepLink: {
      title: "Go to Agile Analytics to see a detailed report  ",
      link: "https://www.prod.agileanalytics.cloud/stock"
    }
  }, riskChartState.error ? /* @__PURE__ */ React.createElement(Alert, {
    severity: "error"
  }, riskChartState == null ? void 0 : riskChartState.error.message) : null, /* @__PURE__ */ React.createElement(AaDoraChart, {
    timeperiod,
    charts: riskChartOptions,
    chartColor: ["#92CE52", "#F8C238", "#E11E1E"],
    loading: riskChartState.loading,
    customPointFormatter: function() {
      return `<span>Branches amount: <b>${this.options.y}</b></span>`;
    },
    customOptions: null,
    yAxisFormatter: null,
    customOpacity: 1
  }))));
};

const AaLeaksPage = ({ timeperiod }) => {
  var _a, _b, _c, _d;
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const leaksState = useAsync(async () => {
    const response = await api.getLeaksData({
      orgHash,
      apiKey,
      dateStart: timeperiod == null ? void 0 : timeperiod.date_start,
      dateEnd: timeperiod == null ? void 0 : timeperiod.date_end
    });
    return response;
  }, [timeperiod]);
  const chartOptions = [
    {
      series: [
        {
          name: "All leakes",
          data: ((_b = (_a = leaksState == null ? void 0 : leaksState.value) == null ? void 0 : _a.statistics) == null ? void 0 : _b.length) ? leaksState.value.statistics.map((item) => {
            return [moment(item.date).unix() * 1e3, item.leaks_quantity];
          }) : []
        },
        {
          name: "Solved",
          data: ((_d = (_c = leaksState == null ? void 0 : leaksState.value) == null ? void 0 : _c.statistics) == null ? void 0 : _d.length) ? leaksState.value.statistics.map((item) => {
            return [moment(item.date).unix() * 1e3, item.leaks_fixed];
          }) : []
        }
      ]
    }
  ];
  if (leaksState == null ? void 0 : leaksState.loading) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if (leaksState == null ? void 0 : leaksState.error) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, leaksState == null ? void 0 : leaksState.error.message);
  }
  return /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 2
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 12
  }, /* @__PURE__ */ React.createElement(InfoCard, {
    title: "Leaks",
    deepLink: {
      title: "Go to Agile Analytics to see a detailed report  ",
      link: "https://www.prod.agileanalytics.cloud/leaks"
    }
  }, /* @__PURE__ */ React.createElement(AaDoraChart, {
    timeperiod,
    charts: chartOptions,
    chartColor: ["#FF6384", "#15A2BB"],
    loading: leaksState.loading,
    customPointFormatter: null,
    customOptions: null,
    yAxisFormatter: null,
    yAxisTitle: "Leaks amount",
    customOpacity: 1,
    isMarker: false,
    isStacking: false
  }))));
};

const AaSloServiceSloCard = ({
  timeperiod,
  service,
  feature
}) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const { date_start, date_end } = timeperiod;
  const chartDataState = useAsync(async () => {
    const response = await api.getErrorBudgetChartData({
      orgHash,
      apiKey,
      serviceName: service.service,
      feature: feature.feature_name,
      date_start,
      date_end,
      step_size: "24 hours"
    });
    return response;
  }, [feature, timeperiod]);
  const sloHistoryState = useAsync(async () => {
    let response = {
      data: null,
      status: 204,
      error: ""
    };
    if (chartDataState == null ? void 0 : chartDataState.value) {
      const dates = [];
      while ((dates == null ? void 0 : dates.length) < 4) {
        let week = null;
        let year = null;
        if (!(dates == null ? void 0 : dates.length)) {
          week = moment().isoWeek();
          year = moment().year();
        } else {
          const endMomentObj = moment((dates[(dates == null ? void 0 : dates.length) - 1][0] - 1) * 1e3);
          week = endMomentObj.isoWeek();
          year = endMomentObj.year();
        }
        const weekStart = moment().year(year).week(week).startOf("week").unix();
        const weekEnd = moment().year(year).week(week).endOf("week").unix();
        dates.push([weekStart, weekEnd]);
      }
      try {
        const values = await Promise.allSettled(dates.map((date) => api.getErrorBudgetChartData({
          orgHash,
          apiKey,
          serviceName: service.service,
          feature: feature.feature_name,
          date_start: date[0],
          date_end: date[1],
          step_size: "24 hours"
        })));
        if (values.length) {
          if (!values.find((value) => value.status === "fulfilled")) {
            response = {
              ...response,
              status: 404,
              error: "error"
            };
          } else {
            let status = 200;
            if (!values.find((value) => value.status === "fulfilled" && value.value.status !== 204)) {
              status = 204;
            }
            const filteredValues = values.filter((value) => value.status === "fulfilled").map((value) => value.value.data ? value.value.data : void 0).filter((value) => value !== void 0);
            const calculatedSloData = filteredValues.map((item) => {
              var _a2;
              return calculateAverageSloValue(item, (_a2 = chartDataState == null ? void 0 : chartDataState.value) == null ? void 0 : _a2.slo_target);
            });
            response = {
              ...response,
              data: {
                slo: calculatedSloData,
                dates
              },
              status
            };
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
    return response;
  }, [chartDataState == null ? void 0 : chartDataState.value]);
  const filteredData = filterData((_a = chartDataState == null ? void 0 : chartDataState.value) == null ? void 0 : _a.data);
  function filterData(dataArray) {
    if (!(dataArray == null ? void 0 : dataArray.length)) {
      return null;
    }
    return dataArray == null ? void 0 : dataArray.map((item) => item[1]);
  }
  function calculateSloValue(filtered, target) {
    if (!(filtered == null ? void 0 : filtered.length) || !target) {
      return 0;
    }
    const latestMeasurement = filtered[filtered.length - 1];
    const totalErrorBudget = 1 - target;
    const avaivableErrorBudget = totalErrorBudget * latestMeasurement / 100;
    const slo = (target + avaivableErrorBudget) * 100;
    return slo.toFixed(3);
  }
  function calculateAverageSloValue(dataPoints, target) {
    const slosForEachPoint = dataPoints.map((dataPoint) => {
      const slo = calculateSloValue([dataPoint[1]], target);
      return +slo;
    });
    const averageSlo = (slosForEachPoint == null ? void 0 : slosForEachPoint.reduce((acc, item) => +acc + +item, 0)) / (slosForEachPoint == null ? void 0 : slosForEachPoint.length);
    return averageSlo.toFixed(3);
  }
  if (chartDataState == null ? void 0 : chartDataState.loading) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if (chartDataState == null ? void 0 : chartDataState.error) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, chartDataState == null ? void 0 : chartDataState.error.message);
  } else if (!(chartDataState == null ? void 0 : chartDataState.value)) {
    return /* @__PURE__ */ React.createElement(Typography, {
      component: "p"
    }, "No data");
  }
  return /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Box, {
    sx: { marginY: "16px", textAlign: "center" }
  }, /* @__PURE__ */ React.createElement(Typography, {
    variant: "h5"
  }, chartDataState.value.slo_name), /* @__PURE__ */ React.createElement(Typography, {
    variant: "subtitle1"
  }, "in the last 24 hours")), /* @__PURE__ */ React.createElement(Divider, {
    "aria-hidden": "true"
  }), /* @__PURE__ */ React.createElement(Box, {
    sx: {
      paddingTop: "12px",
      paddingX: "12px"
    }
  }, /* @__PURE__ */ React.createElement(Typography, {
    component: "p",
    variant: "h6",
    align: "center"
  }, calculateSloValue(filteredData, chartDataState.value.slo_target) ? `${calculateSloValue(filteredData, (_b = chartDataState == null ? void 0 : chartDataState.value) == null ? void 0 : _b.slo_target)}%` : "no SLO DATA")), /* @__PURE__ */ React.createElement(Box, {
    sx: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gridGap: "4px",
      padding: "12px"
    }
  }, +calculateSloValue(filteredData, chartDataState.value.slo_target) > chartDataState.value.slo_target * 100 ? /* @__PURE__ */ React.createElement(CheckCircleOutlineOutlinedIcon, {
    style: { color: "#8ec358", fontSize: 24 }
  }) : /* @__PURE__ */ React.createElement(HighlightOff, {
    style: { color: "#c03a3a", fontSize: 24 }
  }), /* @__PURE__ */ React.createElement(Typography, {
    component: "p",
    variant: "subtitle1",
    align: "center"
  }, "Target: ", chartDataState.value.slo_target * 100, "%")), /* @__PURE__ */ React.createElement(Divider, {
    "aria-hidden": "true"
  }), /* @__PURE__ */ React.createElement(Box, {
    sx: { padding: "12px" }
  }, /* @__PURE__ */ React.createElement(Typography, {
    component: "p",
    variant: "body1"
  }, "Last 4-week history:"), (sloHistoryState == null ? void 0 : sloHistoryState.loading) ? /* @__PURE__ */ React.createElement(Progress, null) : null, !(sloHistoryState == null ? void 0 : sloHistoryState.loading) && (sloHistoryState == null ? void 0 : sloHistoryState.error) ? /* @__PURE__ */ React.createElement(Alert, {
    severity: "error"
  }, "Faled to load SLO's history") : null, !(sloHistoryState == null ? void 0 : sloHistoryState.loading) && !(sloHistoryState == null ? void 0 : sloHistoryState.error) && !((_e = (_d = (_c = sloHistoryState == null ? void 0 : sloHistoryState.value) == null ? void 0 : _c.data) == null ? void 0 : _d.slo) == null ? void 0 : _e.length) ? /* @__PURE__ */ React.createElement(Typography, {
    component: "p",
    variant: "body1"
  }, "No data") : null, !(sloHistoryState == null ? void 0 : sloHistoryState.loading) && !(sloHistoryState == null ? void 0 : sloHistoryState.error) && ((_h = (_g = (_f = sloHistoryState == null ? void 0 : sloHistoryState.value) == null ? void 0 : _f.data) == null ? void 0 : _g.slo) == null ? void 0 : _h.length) ? /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 2
  }, (_k = (_j = (_i = sloHistoryState == null ? void 0 : sloHistoryState.value) == null ? void 0 : _i.data) == null ? void 0 : _j.slo) == null ? void 0 : _k.map((slo) => /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 3
  }, /* @__PURE__ */ React.createElement(Box, {
    sx: {
      padding: "2px",
      bgcolor: `${+slo >= chartDataState.value.slo_target * 100 ? "#8ec358" : "#c03a3a"}`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#fff"
    }
  }, slo)))) : null));
};

const AaSloServiceItem = ({
  timeperiod,
  service
}) => {
  var _a, _b;
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const singleServicesState = useAsync(async () => {
    const response = await api.getSingleServiceData({
      orgHash,
      apiKey,
      serviceName: service.service
    });
    return response;
  }, [service]);
  if (singleServicesState == null ? void 0 : singleServicesState.loading) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if (singleServicesState == null ? void 0 : singleServicesState.error) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, singleServicesState == null ? void 0 : singleServicesState.error.message);
  } else if (!(singleServicesState == null ? void 0 : singleServicesState.value)) {
    return /* @__PURE__ */ React.createElement(Typography, {
      component: "p"
    }, "No data");
  }
  return /* @__PURE__ */ React.createElement(InfoCard, {
    title: `Service: ${service == null ? void 0 : service.service}`,
    subheader: `Operational dashboard URL: ${service == null ? void 0 : service.url}`
  }, !((_b = (_a = singleServicesState == null ? void 0 : singleServicesState.value) == null ? void 0 : _a.features) == null ? void 0 : _b.length) ? /* @__PURE__ */ React.createElement(Typography, {
    component: "p"
  }, "No SLOs") : /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 3,
    alignItems: "stretch"
  }, singleServicesState.value.features.map((feature) => /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 3
  }, /* @__PURE__ */ React.createElement(AaSloServiceSloCard, {
    timeperiod,
    service,
    feature
  })))));
};

const AaSlosPage = ({ timeperiod }) => {
  var _a, _b;
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const servicesState = useAsync(async () => {
    const response = await api.getServicesData({
      orgHash,
      apiKey
    });
    return response;
  }, []);
  if (servicesState == null ? void 0 : servicesState.loading) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if (servicesState == null ? void 0 : servicesState.error) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, servicesState == null ? void 0 : servicesState.error.message);
  } else if (!((_a = servicesState == null ? void 0 : servicesState.value) == null ? void 0 : _a.length)) {
    return /* @__PURE__ */ React.createElement(Typography, {
      component: "p"
    }, "No services find");
  }
  return /* @__PURE__ */ React.createElement(Box, {
    sx: { display: "flex", flexDirection: "column" }
  }, (_b = servicesState == null ? void 0 : servicesState.value) == null ? void 0 : _b.map((item) => /* @__PURE__ */ React.createElement(Box, {
    sx: { marginBottom: "24px" }
  }, /* @__PURE__ */ React.createElement(AaSloServiceItem, {
    timeperiod,
    service: item
  }))));
};

const chartManager = [];
let rafId = null;
Highcharts.Pointer.prototype.reset = function() {
  return void 0;
};
const onMouseLeave = () => {
  if (chartManager.length > 1) {
    chartManager == null ? void 0 : chartManager.forEach((chart) => {
      var _a;
      (_a = chart == null ? void 0 : chart.tooltip) == null ? void 0 : _a.hide();
    });
  }
};
const onMouseMove = (event, target) => {
  if (rafId)
    return;
  rafId = requestAnimationFrame(() => {
    var _a;
    const hoverPoint = target.hoverPoint;
    const currentService = (_a = target == null ? void 0 : target.userOptions) == null ? void 0 : _a.service;
    const chartsFilteredByService = (chartManager == null ? void 0 : chartManager.length) ? chartManager == null ? void 0 : chartManager.filter((item) => {
      var _a2;
      return ((_a2 = item == null ? void 0 : item.userOptions) == null ? void 0 : _a2.service) === currentService;
    }) : [];
    if (hoverPoint && (chartsFilteredByService == null ? void 0 : chartsFilteredByService.length) > 1) {
      chartsFilteredByService == null ? void 0 : chartsFilteredByService.forEach((chart) => {
        const { series = [], xAxis = [] } = chart;
        if (!series || (series == null ? void 0 : series.length) === 0) {
          return;
        }
        const visibleSeries = series.filter((serie) => serie.visible);
        const points = visibleSeries.reduce((memo, serie) => {
          memo.push(...serie.points);
          return memo;
        }, []);
        const { min, max } = {
          min: xAxis[0].min,
          max: xAxis[(xAxis == null ? void 0 : xAxis.length) - 1].max
        };
        const point = points == null ? void 0 : points.find((item) => item.x === hoverPoint.x);
        if (point && (point == null ? void 0 : point.formatPrefix) === "point") {
          if ((point == null ? void 0 : point.series) && hoverPoint.x >= min && hoverPoint.x <= max) {
            point == null ? void 0 : point.onMouseOver();
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
    var _a, _b, _c, _d, _e;
    if (chartComponentRef.current) {
      (_b = (_a = chartComponentRef == null ? void 0 : chartComponentRef.current) == null ? void 0 : _a.chart) == null ? void 0 : _b.xAxis[0].setExtremes();
      (_d = (_c = chartComponentRef == null ? void 0 : chartComponentRef.current) == null ? void 0 : _c.chart) == null ? void 0 : _d.yAxis[0].setExtremes();
    }
    const chart = (_e = chartComponentRef == null ? void 0 : chartComponentRef.current) == null ? void 0 : _e.chart;
    syncTooltip(chart);
  }, [options]);
  return /* @__PURE__ */ React.createElement(HighchartsReact, {
    id: "highchart",
    ref: chartComponentRef,
    highcharts: Highcharts,
    options: (options == null ? void 0 : options.length) ? [...options] : options
  });
};
const AaErrorBudgetsChart = ({
  timeperiod,
  selectedService,
  serviceState,
  step,
  chartState,
  deploymentsList
}) => {
  var _a, _b;
  const [zoomTimeperiod, setZoomTimeperiod] = useState(null);
  const [dataFeaturesVisibility, setDataFeaturesVisibility] = useState(null);
  const [eventsVisibility, setEventsVisibility] = useState(null);
  const errorBudgetChartOptionsBase = generateErrorBudgetChartOptionsBase(dataFeaturesVisibility, setDataFeaturesVisibility, setZoomTimeperiod, false, step);
  const eventsChartOptionsBase = generateEventsChartOptionsBase(setZoomTimeperiod, eventsVisibility, setEventsVisibility, step);
  const featuresList = (_a = serviceState == null ? void 0 : serviceState.features) == null ? void 0 : _a.map((feature) => feature.slo_name);
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
    var _a2, _b2, _c;
    if ((_a2 = chartState == null ? void 0 : chartState.data) == null ? void 0 : _a2.length) {
      let formattedData = data;
      if (!wasChartDataFormatted) {
        formattedData = (_b2 = chartState == null ? void 0 : chartState.data) == null ? void 0 : _b2.map((feature) => {
          if (feature == null ? void 0 : feature.data) {
            feature.data.map((item) => {
              item[0] = item[0] * 1e3;
              return item;
            });
          }
          return feature;
        });
        setWasChartDataFormatted(true);
      } else {
        formattedData = (_c = chartState == null ? void 0 : chartState.data) == null ? void 0 : _c.map((feature) => {
          var _a3;
          if (feature == null ? void 0 : feature.data) {
            (_a3 = feature.data) == null ? void 0 : _a3.map((item) => {
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
          data: [...dataSeries == null ? void 0 : dataSeries.data],
          name: dataSeries.feature,
          tooltip: {
            valueSuffix: " %"
          },
          visible: true
        };
        return formattedSeries;
      });
      setData(formattedDataWithOptions);
      const eventsData = formattedData.reduce((acc, seriesData, index) => {
        const columnsBadSeries = {
          ...seriesData,
          title: seriesData.slo_name,
          type: "column",
          data: [...seriesData == null ? void 0 : seriesData.data].map((dataItem) => {
            if (dataItem == null ? void 0 : dataItem.length) {
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
          data: [...seriesData == null ? void 0 : seriesData.data].map((dataItem) => {
            if (dataItem == null ? void 0 : dataItem.length) {
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
      }, []);
      setDataEvents([...eventsData]);
    }
  }, [chartState == null ? void 0 : chartState.data, serviceState]);
  useEffect(() => {
    const visibility = data.reduce((acc, dataSeries) => {
      return {
        ...acc,
        [(dataSeries == null ? void 0 : dataSeries.slo_name) ? dataSeries == null ? void 0 : dataSeries.slo_name : dataSeries == null ? void 0 : dataSeries.title]: true
      };
    }, {});
    setDataFeaturesVisibility(visibility);
    const updatedErrorBudgetOptions = {
      ...errorBudgetChartOptionsBase,
      series: [...data].map((series) => {
        return {
          ...series,
          visible: visibility ? visibility[(series == null ? void 0 : series.slo_name) ? series == null ? void 0 : series.slo_name : series == null ? void 0 : series.name] : true
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
    var _a2;
    const visibility = dataEvents.reduce((acc, dataSeries) => {
      if (dataSeries == null ? void 0 : dataSeries.id) {
        return {
          ...acc,
          [dataSeries.title]: {
            [dataSeries == null ? void 0 : dataSeries.name]: true
          }
        };
      }
      return {
        ...acc,
        [dataSeries.title]: {
          ...acc[dataSeries == null ? void 0 : dataSeries.title],
          [dataSeries == null ? void 0 : dataSeries.name]: false
        }
      };
    }, {});
    setEventsVisibility(visibility);
    if (dataFeaturesVisibility && ((_a2 = Object.keys(dataFeaturesVisibility)) == null ? void 0 : _a2.length)) {
      const updatedEventsChartSeries = Object.keys(dataFeaturesVisibility).reduce((acc, featureName) => {
        var _a3;
        const updatedAcc = {
          ...acc,
          [featureName]: {
            ...eventsChartOptionsBase,
            series: (_a3 = [...dataEvents].filter((dataSeries) => dataSeries.title === featureName)) == null ? void 0 : _a3.map((series) => {
              const updated = {
                ...series,
                visible: (series == null ? void 0 : series.id) ? true : false
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
    var _a2;
    if (dataFeaturesVisibility && ((_a2 = Object.keys(dataFeaturesVisibility)) == null ? void 0 : _a2.length)) {
      const updatedEventsChartSeries = Object.keys(dataFeaturesVisibility).reduce((acc, featureName) => {
        var _a3, _b2;
        const updatedAcc = {
          ...acc,
          [featureName]: {
            ...eventsChartOptionsBase,
            series: zoomTimeperiod ? (_a3 = [...zoomedDataEvents != null ? zoomedDataEvents : []].filter((dataSeries) => dataSeries.title === featureName)) == null ? void 0 : _a3.map((series) => {
              const updated = {
                ...series,
                visible: eventsVisibility ? eventsVisibility[featureName][series == null ? void 0 : series.name] : null
              };
              return updated;
            }) : (_b2 = [...dataEvents].filter((dataSeries) => dataSeries.title === featureName)) == null ? void 0 : _b2.map((series) => {
              const updated = {
                ...series,
                visible: eventsVisibility ? eventsVisibility[featureName][series == null ? void 0 : series.name] : null
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
    var _a2;
    if (dataFeaturesVisibility && ((_a2 = Object.keys(dataFeaturesVisibility)) == null ? void 0 : _a2.length)) {
      const copiedDataEvents = _.cloneDeep(dataEvents);
      const updatedEventsOptions = Object.keys(dataFeaturesVisibility).reduce((acc, featureName) => {
        var _a3, _b2, _c;
        const updatedAcc = {
          ...acc,
          [featureName]: {
            ...eventsChartOptionsBase,
            series: zoomTimeperiod ? (_b2 = (_a3 = [...zoomedDataEvents != null ? zoomedDataEvents : []]) == null ? void 0 : _a3.filter((dataSeries) => dataSeries.title === featureName)) == null ? void 0 : _b2.map((series) => {
              const updated = {
                ...series,
                visible: eventsVisibility ? eventsVisibility[featureName][series == null ? void 0 : series.name] : null
              };
              return updated;
            }) : (_c = [...copiedDataEvents].filter((dataSeries) => dataSeries.title === featureName)) == null ? void 0 : _c.map((series) => {
              const updated = {
                ...series,
                visible: eventsVisibility ? eventsVisibility[featureName][series == null ? void 0 : series.name] : null
              };
              return updated;
            }),
            service: selectedService
          }
        };
        return updatedAcc;
      }, {});
      setEventsChartSeries(updatedEventsOptions);
      const copiedData = _.cloneDeep(data);
      const updatedErrorBudgetOptions = {
        ...errorBudgetChartOptionsBase,
        series: zoomTimeperiod ? [...zoomedData].map((series) => {
          return {
            ...series,
            visible: dataFeaturesVisibility ? dataFeaturesVisibility[(series == null ? void 0 : series.slo_name) ? series == null ? void 0 : series.slo_name : series == null ? void 0 : series.name] : true
          };
        }) : [...copiedData].map((series) => {
          return {
            ...series,
            visible: dataFeaturesVisibility ? dataFeaturesVisibility[(series == null ? void 0 : series.slo_name) ? series == null ? void 0 : series.slo_name : series == null ? void 0 : series.name] : true
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
    var _a2;
    const updatedErrorBudgetOptions = {
      ...errorBudgetChartOptionsBase,
      series: (_a2 = errorBudgetChartSeries == null ? void 0 : errorBudgetChartSeries.series) == null ? void 0 : _a2.map((series) => {
        return {
          ...series,
          visible: dataFeaturesVisibility ? dataFeaturesVisibility[(series == null ? void 0 : series.slo_name) ? series == null ? void 0 : series.slo_name : series == null ? void 0 : series.name] : true
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
        const filteredEvents = filterDataEvents([...copiedDataEvents], zoomTimeperiod[0], zoomTimeperiod[1]);
        setZoomedDataEvents(filteredEvents);
      }
      if (copiedData) {
        const filteredData = filterDataEvents([...copiedData], zoomTimeperiod[0], zoomTimeperiod[1]);
        setZoomedData([...filteredData]);
      }
    }
  }, [zoomTimeperiod]);
  if (!(featuresList == null ? void 0 : featuresList.length)) {
    return /* @__PURE__ */ React.createElement("div", {
      className: "mr-5",
      style: { width: "100%", height: "190px" }
    }, /* @__PURE__ */ React.createElement("p", {
      className: "text-center text-gray-500 text-xl p-4"
    }, "No SLOs. Add a SLO to start gathering data"));
  }
  const clonedOptions = JSON.parse(JSON.stringify(errorBudgetChartSeries));
  if ((_b = errorBudgetChartSeries == null ? void 0 : errorBudgetChartSeries.chart) == null ? void 0 : _b.events) {
    clonedOptions.chart.events = errorBudgetChartSeries.chart.events;
    clonedOptions.tooltip.formatter = errorBudgetChartSeries.tooltip.formatter;
    clonedOptions.tooltip.positioner = errorBudgetChartSeries.tooltip.positioner;
    clonedOptions.plotOptions = errorBudgetChartSeries.plotOptions;
    clonedOptions.legend = errorBudgetChartSeries.legend;
    clonedOptions.legend.labelFormatter = errorBudgetChartSeries.legend.labelFormatter;
    clonedOptions.xAxis.plotLines = deploymentsVisible ? zoomTimeperiod ? formatPlotLines(deploymentsList, zoomTimeperiod[0], zoomTimeperiod[1]) : formatPlotLines(deploymentsList, (timeperiod == null ? void 0 : timeperiod.date_start) * 1e3, (timeperiod == null ? void 0 : timeperiod.date_end) * 1e3) : null;
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: "relative"
  }, /* @__PURE__ */ React.createElement(Box, {
    className: "absolute gap-12 ",
    sx: {
      height: "42px",
      display: "flex",
      justifyContent: "end",
      alignItems: "center"
    }
  }, /* @__PURE__ */ React.createElement(Button, {
    variant: "contained",
    onClick: () => {
      setDeploymentsVisible((prevState) => !prevState);
    }
  }, deploymentsVisible ? "Hide" : "Show", " deployments"), zoomTimeperiod ? /* @__PURE__ */ React.createElement(Button, {
    variant: "outlined",
    onClick: () => {
      setZoomTimeperiod(null);
    }
  }, "Reset zoom") : null), clonedOptions ? /* @__PURE__ */ React.createElement(SyncChart, {
    options: clonedOptions
  }) : null, /* @__PURE__ */ React.createElement("div", {
    className: "mt-4"
  }, dataFeaturesVisibility && Object.keys(dataFeaturesVisibility).map((featureName, i) => {
    if (dataFeaturesVisibility[featureName]) {
      return /* @__PURE__ */ React.createElement("div", {
        key: featureName
      }, /* @__PURE__ */ React.createElement(Box, {
        className: "",
        sx: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          marginTop: "48px"
        }
      }, /* @__PURE__ */ React.createElement(Typography, {
        variant: "h6",
        component: "p"
      }, featureName, " good/bad events"), zoomTimeperiod ? /* @__PURE__ */ React.createElement(Button, {
        variant: "outlined",
        onClick: () => {
          setZoomTimeperiod(null);
        }
      }, "Reset zoom") : null), eventsChartSeries && eventsChartSeries[featureName] ? /* @__PURE__ */ React.createElement(SyncChart, {
        options: eventsChartSeries[featureName]
      }) : null);
    }
    return null;
  })));
};

const AaErrorBudgetsServiceItem = ({
  timeperiod,
  service,
  deploymentsList
}) => {
  var _a, _b, _c, _d, _e;
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const { date_start: dateTimeStart, date_end: dateTimeEnd } = timeperiod;
  const singleServicesState = useAsync(async () => {
    const response = await api.getSingleServiceData({
      orgHash,
      apiKey,
      serviceName: service.service
    });
    return response;
  }, [service]);
  const chartDataState = useAsync(async () => {
    var _a2, _b2, _c2;
    let response = {
      data: null,
      status: 204,
      error: ""
    };
    if ((_b2 = (_a2 = singleServicesState == null ? void 0 : singleServicesState.value) == null ? void 0 : _a2.features) == null ? void 0 : _b2.length) {
      try {
        const values = await Promise.allSettled((_c2 = singleServicesState == null ? void 0 : singleServicesState.value) == null ? void 0 : _c2.features.map((featureItem) => api.getErrorBudgetChartData({
          orgHash,
          apiKey,
          serviceName: service.service,
          feature: featureItem.feature_name,
          date_start: dateTimeStart,
          date_end: dateTimeEnd,
          step_size: "24 hours"
        })));
        if (values.length) {
          if (!values.find((value) => value.status === "fulfilled")) {
            response = {
              ...response,
              status: 404,
              error: "error"
            };
          } else {
            let status = 200;
            if (!values.find((value) => value.status === "fulfilled" && value.value.status !== 204)) {
              status = 204;
            }
            response = {
              ...response,
              data: values.filter((value) => (value == null ? void 0 : value.status) === "fulfilled").map((value) => (value == null ? void 0 : value.value) ? value.value : void 0).filter((value) => value !== void 0),
              status: 200
            };
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
    return response;
  }, [singleServicesState == null ? void 0 : singleServicesState.value]);
  if ((singleServicesState == null ? void 0 : singleServicesState.loading) || (chartDataState == null ? void 0 : chartDataState.loading)) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if ((singleServicesState == null ? void 0 : singleServicesState.error) || (chartDataState == null ? void 0 : chartDataState.error)) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, (_c = (_a = singleServicesState == null ? void 0 : singleServicesState.error) == null ? void 0 : _a.message) != null ? _c : (_b = chartDataState == null ? void 0 : chartDataState.error) == null ? void 0 : _b.message);
  } else if (!(singleServicesState == null ? void 0 : singleServicesState.value) || !(chartDataState == null ? void 0 : chartDataState.value)) {
    return /* @__PURE__ */ React.createElement(Typography, {
      component: "p"
    }, "No data");
  }
  return /* @__PURE__ */ React.createElement(InfoCard, {
    title: `Service: ${service == null ? void 0 : service.service}`,
    subheader: `Operational dashboard URL: ${service == null ? void 0 : service.url}`
  }, !((_e = (_d = singleServicesState == null ? void 0 : singleServicesState.value) == null ? void 0 : _d.features) == null ? void 0 : _e.length) ? /* @__PURE__ */ React.createElement(Typography, {
    component: "p"
  }, "No Error budgets data") : /* @__PURE__ */ React.createElement(AaErrorBudgetsChart, {
    timeperiod,
    selectedService: service == null ? void 0 : service.service,
    serviceState: singleServicesState == null ? void 0 : singleServicesState.value,
    step: "24 hours",
    chartState: chartDataState == null ? void 0 : chartDataState.value,
    deploymentsList
  }));
};

const AaErrorBudgetsPage = ({
  timeperiod
}) => {
  var _a, _b, _c, _d;
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const servicesState = useAsync(async () => {
    const response = await api.getServicesData({
      orgHash,
      apiKey
    });
    return response;
  }, []);
  const deploymentFreqState = useAsync(async () => {
    const response = await api.getDeploymentFreqData({
      orgHash,
      apiKey,
      dateStart: timeperiod == null ? void 0 : timeperiod.date_start,
      dateEnd: timeperiod == null ? void 0 : timeperiod.date_end
    });
    return response;
  }, [timeperiod]);
  if ((servicesState == null ? void 0 : servicesState.loading) || (deploymentFreqState == null ? void 0 : deploymentFreqState.loading)) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if ((servicesState == null ? void 0 : servicesState.error) || (deploymentFreqState == null ? void 0 : deploymentFreqState.error)) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, ((_a = servicesState == null ? void 0 : servicesState.error) == null ? void 0 : _a.message) ? servicesState == null ? void 0 : servicesState.error.message : (_b = deploymentFreqState == null ? void 0 : deploymentFreqState.error) == null ? void 0 : _b.message);
  } else if (!((_c = servicesState == null ? void 0 : servicesState.value) == null ? void 0 : _c.length)) {
    return /* @__PURE__ */ React.createElement(Typography, {
      component: "p"
    }, "No services find");
  }
  return /* @__PURE__ */ React.createElement(Box, {
    sx: { display: "flex", flexDirection: "column" }
  }, (_d = servicesState == null ? void 0 : servicesState.value) == null ? void 0 : _d.map((item) => /* @__PURE__ */ React.createElement(Box, {
    sx: { marginBottom: "24px" }
  }, /* @__PURE__ */ React.createElement(AaErrorBudgetsServiceItem, {
    timeperiod,
    service: item,
    deploymentsList: deploymentFreqState == null ? void 0 : deploymentFreqState.value
  }))));
};

init({ data });
const AaKudosLast = ({
  users,
  kudos,
  kudosLeaderBoard
}) => {
  const createFromToTitle = () => {
    const fromUser = users.data.find((user) => user.hash === kudosLeaderBoard.last_kudo.from);
    const from = fromUser ? fromUser.user_name : "";
    const toUser = users.data.find((user) => user.hash === kudosLeaderBoard.last_kudo.to);
    const to = toUser ? toUser.user_name : "";
    return /* @__PURE__ */ React.createElement(Box, {
      sx: { fontWeight: 700, fontSize: "18px", margin: 0, padding: 0 }
    }, "From ", /* @__PURE__ */ React.createElement("span", {
      className: "person from"
    }, from), " to ", /* @__PURE__ */ React.createElement("span", {
      className: "person to"
    }, to));
  };
  const createChannelTitle = () => {
    const channel = kudosLeaderBoard.last_kudo.channel;
    return /* @__PURE__ */ React.createElement(Box, {
      sx: { color: "#ccc" }
    }, "#", /* @__PURE__ */ React.createElement("span", {
      className: ""
    }, channel));
  };
  const getEmojisFromMessage = () => {
    const message = kudosLeaderBoard.last_kudo.message ? kudosLeaderBoard.last_kudo.message : "";
    const emojiInMessageQuantity = kudosLeaderBoard.last_kudo.amount ? kudosLeaderBoard.last_kudo.amount : "0";
    const regex = /:[^\s]*:/gm;
    const emojiInMessageArray = Array.from(message.matchAll(regex));
    const listOfEmojis = kudos.filter((emoji) => {
      return emojiInMessageArray.findIndex((e) => e[0] === emoji);
    });
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Box, {
      sx: {
        marginRight: "8px",
        fontSize: 40,
        color: "#8ec358",
        fontWeight: 500
      }
    }, "+", emojiInMessageQuantity), /* @__PURE__ */ React.createElement(Box, null, listOfEmojis.map((emoji) => /* @__PURE__ */ React.createElement("em-emoji", {
      id: emoji,
      size: 40,
      set: "google"
    }))));
  };
  const transformMessageWithEmoji = () => {
    const message = kudosLeaderBoard.last_kudo.message ? kudosLeaderBoard.last_kudo.message : "";
    const regex = /:[^\s]*:/gm;
    const emojiInMessage = message.matchAll(regex);
    const emojiInMessageArray = Array.from(message.matchAll(regex));
    const partOfStr = [];
    let strStart = 0;
    for (const emoji of emojiInMessage) {
      const strPart = message.slice(strStart, emoji.index);
      partOfStr.push(strPart);
      strStart = emoji.index + emoji[0].length + 1;
    }
    partOfStr.push(message.slice(strStart));
    const newmess = partOfStr.map((str, index) => {
      if (index === partOfStr.length - 1) {
        return str;
      }
      const emoji = emojiInMessageArray[index][0];
      return /* @__PURE__ */ React.createElement(Fragment, {
        key: `${index}${emoji}`
      }, str, /* @__PURE__ */ React.createElement("em-emoji", {
        id: emoji,
        size: 18,
        set: "google"
      }));
    });
    return newmess;
  };
  const getContent = () => {
    if (+kudosLeaderBoard.total_kudos === 0 || Object.keys(kudosLeaderBoard.last_kudo).length === 0) {
      return /* @__PURE__ */ React.createElement(Box, null, "No messages");
    }
    return /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Box, {
      sx: {
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /* @__PURE__ */ React.createElement(Box, null, createFromToTitle(), createChannelTitle()), /* @__PURE__ */ React.createElement(Box, {
      sx: { display: "flex", alignItems: "center" }
    }, getEmojisFromMessage())), /* @__PURE__ */ React.createElement(Box, {
      sx: {
        padding: "12px",
        borderRadius: "8px",
        bgcolor: "#ccc",
        marginTop: " 16px"
      }
    }, /* @__PURE__ */ React.createElement(Box, {
      className: "message"
    }, transformMessageWithEmoji())));
  };
  return /* @__PURE__ */ React.createElement(InfoCard, {
    title: "Latest Kudos",
    className: "full-height"
  }, /* @__PURE__ */ React.createElement(Box, null, getContent()));
};

init({ data });
const AaKudosTotal = ({
  users,
  kudos,
  kudosLeaderBoard
}) => {
  const createEmojiList = () => {
    return kudos.map((emoji) => /* @__PURE__ */ React.createElement("em-emoji", {
      id: emoji,
      key: emoji,
      size: 60,
      set: "google"
    }));
  };
  const createContent = () => {
    if (kudosLeaderBoard.total_kudos !== null) {
      if (+kudosLeaderBoard.total_kudos === 0) {
        return /* @__PURE__ */ React.createElement("p", {
          className: "font-display text-center text-gray-500 text-xl p-4"
        }, "No kudos");
      }
      return /* @__PURE__ */ React.createElement(Box, {
        sx: {
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }
      }, /* @__PURE__ */ React.createElement(Box, {
        sx: {
          marginRight: "36px",
          fontSize: 60,
          color: "#8ec358",
          fontWeight: 500
        }
      }, "+", kudosLeaderBoard.total_kudos), /* @__PURE__ */ React.createElement("div", {
        className: "kudos-total__emojis"
      }, createEmojiList()));
    }
    return /* @__PURE__ */ React.createElement("p", {
      className: "text-center text-gray-500 text-xl p-4"
    }, "No team data");
  };
  return /* @__PURE__ */ React.createElement(InfoCard, {
    title: "Total kudos this timeperiod",
    className: "full-height"
  }, /* @__PURE__ */ React.createElement(Box, null, createContent()));
};

init({ data });
const AaKudosLeaderboard = ({
  localTeamsState,
  selectedTeam,
  setActiveTeam,
  teamsState,
  users,
  kudos,
  kudosLeaderBoard,
  timeperiod
}) => {
  const transformTeamList = () => {
    const transformed = localTeamsState.map((team) => {
      return {
        value: team.team_hash,
        label: team.team_name
      };
    });
    return (transformed == null ? void 0 : transformed.length) ? transformed : [];
  };
  const getSelectedTeam = () => {
    const selected = transformTeamList().find((team) => team.value === selectedTeam);
    return selected ? selected : { value: "all", label: "Overall" };
  };
  const createList = () => {
    if (selectedTeam === "all") {
      const teamUsers = users == null ? void 0 : users.data.map((user) => user.hash);
      if (teamUsers.length === 0) {
        return /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("p", {
          className: "font-display text-center text-gray-500 text-xl p-4"
        }, "No users in team"));
      }
      const sortedList = kudosLeaderBoard.team_members_list.length > 0 ? [...kudosLeaderBoard.team_members_list] : teamUsers.map((userHash) => ({
        hash: userHash,
        emoji_quantity: 0,
        rank: 1
      }));
      return sortedList.map((userData, index) => {
        return /* @__PURE__ */ React.createElement(LeaderbordBodyRow, {
          emoji: kudos,
          key: userData.hash,
          person: users.data.find((user) => user.hash === userData.hash),
          rank: userData.rank,
          emojiQuantity: userData.emoji_quantity,
          usersList: sortedList,
          index
        });
      });
    }
    const currentTeam = localTeamsState.find((team) => team.team_hash === selectedTeam);
    if (currentTeam) {
      const teamUsers = currentTeam == null ? void 0 : currentTeam.users_in_team;
      if (teamUsers.length === 0 || teamUsers.length === 1 && teamUsers[0] === "") {
        return /* @__PURE__ */ React.createElement("li", {
          className: "flex-grow"
        }, /* @__PURE__ */ React.createElement("p", {
          className: "font-display text-center text-gray-500 text-xl p-4"
        }, "No users in team"));
      }
      const sortedList = kudosLeaderBoard.team_members_list.length > 0 ? [...kudosLeaderBoard.team_members_list] : teamUsers.map((userHash) => ({
        hash: userHash,
        emoji_quantity: 0,
        rank: 1
      }));
      return sortedList.map((userData, index) => {
        return /* @__PURE__ */ React.createElement(LeaderbordBodyRow, {
          emoji: kudos,
          key: userData.hash,
          person: users.data.find((user) => user.hash === userData.hash),
          rank: userData.rank,
          usersList: sortedList,
          emojiQuantity: userData.emoji_quantity,
          index
        });
      });
    }
    return null;
  };
  if (localTeamsState.length === 1) {
    return /* @__PURE__ */ React.createElement("div", {
      className: "flex justify-between items-center"
    }, /* @__PURE__ */ React.createElement("p", null, localTeamsState[0].team_name), /* @__PURE__ */ React.createElement("p", {
      className: "inline-block py-2 px-4 border border-solid border-gray-300 rounded font-display text-gray-600"
    }, localTeamsState[0].team_name));
  }
  const selectedValue = getSelectedTeam();
  return /* @__PURE__ */ React.createElement(InfoCard, {
    title: "Leaderboard",
    className: "full-height"
  }, /* @__PURE__ */ React.createElement(Box$1, null, /* @__PURE__ */ React.createElement(Box$1, {
    sx: { minWidth: "260px" }
  }, (localTeamsState == null ? void 0 : localTeamsState.length) === 1 ? /* @__PURE__ */ React.createElement("p", {
    className: "inline-block py-2 px-4 border border-solid border-gray-300 rounded font-display text-gray-600"
  }, localTeamsState[0].team_name) : /* @__PURE__ */ React.createElement(Select, {
    items: transformTeamList(),
    selected: selectedValue == null ? void 0 : selectedValue.value,
    onChange: (event) => setActiveTeam(event),
    label: "Selected Team"
  }))), /* @__PURE__ */ React.createElement(Box$1, {
    sx: { maxHeight: "360px", overflow: "auto" }
  }, /* @__PURE__ */ React.createElement(List, null, createList())));
};
function LeaderbordBodyRow({
  person,
  rank,
  usersList,
  emoji,
  emojiQuantity,
  index
}) {
  const getRank = (title) => {
    if (index !== 0) {
      const prevRank = usersList[index - 1].rank;
      if (rank === prevRank || emojiQuantity === 0)
        return "";
      if (title) {
        return rank;
      }
      return `${rank}.`;
    }
    return rank;
  };
  return /* @__PURE__ */ React.createElement(ListItem, {
    className: `rank rank-${rank ? getRank("title") : +index + 1}`,
    divider: true
  }, /* @__PURE__ */ React.createElement(Box$1, {
    className: "gap-32",
    sx: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      fontWeight: 600,
      fontSize: "18px"
    }
  }, /* @__PURE__ */ React.createElement(Box$1, {
    className: "gap-32",
    sx: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /* @__PURE__ */ React.createElement("p", null, rank ? getRank() : `${+index + 1}.`), /* @__PURE__ */ React.createElement(Box$1, {
    className: "gap-8",
    sx: {
      display: "flex",
      alignItems: "center"
    }
  }, /* @__PURE__ */ React.createElement(Box$1, {
    sx: {
      width: "40px",
      height: "40px",
      borderRadius: "100%",
      overflow: "hidden",
      position: "relative"
    }
  }, /* @__PURE__ */ React.createElement("img", {
    src: person == null ? void 0 : person.photo,
    alt: "User",
    className: "userpic-kudos"
  })), /* @__PURE__ */ React.createElement("p", null, (person == null ? void 0 : person.user_name) ? person.user_name : person == null ? void 0 : person.email))), /* @__PURE__ */ React.createElement(Box$1, {
    className: "gap-8",
    sx: {
      display: "flex",
      alignItems: "center"
    }
  }, /* @__PURE__ */ React.createElement("p", null, emojiQuantity), /* @__PURE__ */ React.createElement("div", {
    className: "flex items-center"
  }, emoji.map((emojiItem) => /* @__PURE__ */ React.createElement("em-emoji", {
    id: emojiItem,
    key: emojiItem,
    size: 16,
    set: "google"
  }))))));
}

const AaKudosChart = ({
  timeperiod,
  users,
  activeTeam
}) => {
  var _a;
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const { date_end, date_start } = timeperiod;
  const kudosSankeyState = useAsync(async () => {
    const response = await api.getTeamKudosSankeyData({
      orgHash,
      apiKey,
      team: activeTeam ? activeTeam : "all",
      date_end,
      date_start
    });
    return response;
  }, [timeperiod]);
  const getChartHeight = () => {
    var _a2;
    if ((_a2 = kudosSankeyState == null ? void 0 : kudosSankeyState.value) == null ? void 0 : _a2.length) {
      const senders = new Set(kudosSankeyState == null ? void 0 : kudosSankeyState.value.map((chartDataItem) => chartDataItem[0]));
      const recipient = new Set(kudosSankeyState == null ? void 0 : kudosSankeyState.value.map((chartDataItem) => chartDataItem[1]));
      if (senders.size === recipient.size || senders.size > recipient.size) {
        return `${senders.size}00px`;
      }
      return `${recipient.size}00px`;
    }
    return "500px";
  };
  const getUserName = (userHash) => {
    var _a2, _b, _c;
    const hash = userHash ? (_a2 = `${userHash}`) == null ? void 0 : _a2.split(" ").join("") : "";
    return (_c = (_b = users == null ? void 0 : users.data) == null ? void 0 : _b.find((user) => user.hash === hash)) == null ? void 0 : _c.user_name;
  };
  const transformationData = () => {
    var _a2;
    const newData = (_a2 = kudosSankeyState == null ? void 0 : kudosSankeyState.value) == null ? void 0 : _a2.map((item) => {
      const nameFrom = getUserName(item[0]);
      const nameTo = `${getUserName(item[1])} `;
      const tooltipStr = `${nameFrom} gave ${item[2]} kudo(s) to ${nameTo}`;
      return [nameFrom, nameTo, item[2], tooltipStr];
    });
    return [
      ["From", "To", "Quantity", { type: "string", role: "tooltip" }],
      ...(newData == null ? void 0 : newData.length) ? newData : []
    ];
  };
  if (kudosSankeyState == null ? void 0 : kudosSankeyState.loading) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if (kudosSankeyState == null ? void 0 : kudosSankeyState.error) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, (_a = kudosSankeyState == null ? void 0 : kudosSankeyState.error) == null ? void 0 : _a.message);
  } else if (!(kudosSankeyState == null ? void 0 : kudosSankeyState.value)) {
    return /* @__PURE__ */ React.createElement(Typography, {
      component: "p"
    }, "No data");
  }
  return /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Chart, {
    width: "100%",
    height: getChartHeight(),
    chartType: "Sankey",
    options: {
      sankey: {
        fontName: "'Roboto', sans-serif",
        node: {
          colors: ["#D8D95C", "#8EC358", "#EE8282", "#4C72BD", "#484A53"],
          label: {
            color: "#484A53",
            fontSize: "16"
          }
        },
        link: {
          colorMode: "gradient",
          colors: ["#D8D95C", "#8EC358", "#EE8282", "#4C72BD", "#484A53"]
        }
      }
    },
    loader: /* @__PURE__ */ React.createElement("div", null, "Loading Chart"),
    data: transformationData(),
    rootProps: { "data-testid": "1" }
  }));
};

const AaKudosPage = ({ timeperiod }) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const { date_start, date_end } = timeperiod;
  const teamsDataState = useAsync(async () => {
    const response = await api.getTeamsData({
      orgHash,
      apiKey
    });
    return response;
  }, []);
  const workspacesState = useAsync(async () => {
    const response = await api.getWorkspacesData({
      orgHash,
      apiKey
    });
    return response;
  }, []);
  const emojiState = useAsync(async () => {
    const response = await api.getEmoji({
      orgHash,
      apiKey
    });
    return response;
  }, [timeperiod]);
  const [activeTeam, setActiveTeam] = useState(null);
  const kudosLeaderBoardState = useAsync(async () => {
    const response = await api.getTeamKudosLeaderBoard({
      orgHash,
      apiKey,
      team: activeTeam ? activeTeam : "all",
      date_end,
      date_start
    });
    return response;
  }, [activeTeam, timeperiod]);
  const [localTeamsState, setLocalTeamsState] = useState(() => {
    if (teamsDataState == null ? void 0 : teamsDataState.value) {
      return {
        ...teamsDataState,
        data: [
          ...(teamsDataState == null ? void 0 : teamsDataState.value) || null,
          {
            team_hash: "all",
            team_name: "Overall",
            users_in_team: []
          }
        ]
      };
    }
    return {
      ...teamsDataState,
      data: [
        {
          team_hash: "all",
          team_name: "Overall",
          users_in_team: []
        }
      ]
    };
  });
  const orgUsersState = useAsync(async () => {
    let response = {
      data: null,
      status: 204,
      error: ""
    };
    const usersList = await api.getOrgUsersData({
      orgHash,
      apiKey
    });
    if (usersList == null ? void 0 : usersList.length) {
      try {
        const values = await Promise.allSettled(usersList.map((user) => {
          var _a2;
          if ((user == null ? void 0 : user.photo) && !((_a2 = user == null ? void 0 : user.photo) == null ? void 0 : _a2.startsWith("https://"))) {
            const userPic = api.getUserPic({
              orgHash,
              apiKey,
              url: user == null ? void 0 : user.photo
            });
            return userPic;
          }
          return user == null ? void 0 : user.photo;
        }));
        const usersListWithUserPics = usersList == null ? void 0 : usersList.map((user, i) => {
          var _a2;
          return { ...user, photo: (_a2 = values[i]) == null ? void 0 : _a2.value };
        });
        response = { data: usersListWithUserPics, status: 200, error: "" };
      } catch (err) {
        console.log(err);
      }
    }
    return response;
  }, []);
  useEffect(() => {
    if (!(teamsDataState == null ? void 0 : teamsDataState.value)) {
      setActiveTeam("all");
      setLocalTeamsState(() => {
        return {
          ...teamsDataState || null,
          data: [
            {
              team_hash: "all",
              team_name: "Overall",
              users_in_team: []
            }
          ]
        };
      });
    } else {
      setActiveTeam("all");
      setLocalTeamsState(() => {
        return {
          ...teamsDataState || null,
          data: [
            {
              team_hash: "all",
              team_name: "Overall",
              users_in_team: []
            },
            ...(teamsDataState == null ? void 0 : teamsDataState.value) || []
          ]
        };
      });
    }
  }, [teamsDataState == null ? void 0 : teamsDataState.value, workspacesState == null ? void 0 : workspacesState.value]);
  if ((teamsDataState == null ? void 0 : teamsDataState.loading) || (workspacesState == null ? void 0 : workspacesState.loading) || (orgUsersState == null ? void 0 : orgUsersState.loading)) {
    return /* @__PURE__ */ React.createElement(Progress, null);
  } else if ((teamsDataState == null ? void 0 : teamsDataState.error) || (workspacesState == null ? void 0 : workspacesState.error) || (orgUsersState == null ? void 0 : orgUsersState.error)) {
    return /* @__PURE__ */ React.createElement(Alert, {
      severity: "error"
    }, ((_a = teamsDataState == null ? void 0 : teamsDataState.error) == null ? void 0 : _a.message) ? teamsDataState == null ? void 0 : teamsDataState.error.message : ((_b = workspacesState == null ? void 0 : workspacesState.error) == null ? void 0 : _b.message) ? (_c = workspacesState == null ? void 0 : workspacesState.error) == null ? void 0 : _c.message : (_d = orgUsersState == null ? void 0 : orgUsersState.error) == null ? void 0 : _d.message);
  } else if (!((_e = localTeamsState == null ? void 0 : localTeamsState.data) == null ? void 0 : _e.length)) {
    return /* @__PURE__ */ React.createElement(Typography, {
      component: "p"
    }, "No data");
  } else if (!(workspacesState == null ? void 0 : workspacesState.value)) {
    return /* @__PURE__ */ React.createElement(Typography, {
      component: "p"
    }, "Slack is not connected");
  } else if (!(orgUsersState == null ? void 0 : orgUsersState.value)) {
    return /* @__PURE__ */ React.createElement(Typography, {
      component: "p"
    }, "No users in the organisation");
  }
  return /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 3,
    alignItems: "stretch"
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 4
  }, /* @__PURE__ */ React.createElement(AaKudosLast, {
    users: orgUsersState == null ? void 0 : orgUsersState.value,
    kudos: (emojiState == null ? void 0 : emojiState.value) ? emojiState == null ? void 0 : emojiState.value : [],
    kudosLeaderBoard: kudosLeaderBoardState == null ? void 0 : kudosLeaderBoardState.value
  })), /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 4
  }, /* @__PURE__ */ React.createElement(AaKudosTotal, {
    users: orgUsersState == null ? void 0 : orgUsersState.value,
    kudos: (emojiState == null ? void 0 : emojiState.value) ? emojiState == null ? void 0 : emojiState.value : [],
    kudosLeaderBoard: kudosLeaderBoardState == null ? void 0 : kudosLeaderBoardState.value
  })), /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 4
  }, /* @__PURE__ */ React.createElement(AaKudosLeaderboard, {
    localTeamsState: ((_f = localTeamsState == null ? void 0 : localTeamsState.data) == null ? void 0 : _f.length) ? localTeamsState == null ? void 0 : localTeamsState.data : [],
    selectedTeam: activeTeam,
    setActiveTeam,
    teamsState: ((_g = teamsDataState == null ? void 0 : teamsDataState.value) == null ? void 0 : _g.length) ? teamsDataState == null ? void 0 : teamsDataState.value : [],
    users: orgUsersState == null ? void 0 : orgUsersState.value,
    kudos: (emojiState == null ? void 0 : emojiState.value) ? emojiState == null ? void 0 : emojiState.value : [],
    kudosLeaderBoard: kudosLeaderBoardState == null ? void 0 : kudosLeaderBoardState.value,
    timeperiod
  })), /* @__PURE__ */ React.createElement(Grid, {
    item: true,
    xs: 12
  }, /* @__PURE__ */ React.createElement(AaKudosChart, {
    timeperiod,
    users: orgUsersState == null ? void 0 : orgUsersState.value,
    activeTeam: activeTeam ? activeTeam : "all"
  })));
};

const AaContentComponent = ({
  orgData
}) => {
  const [timeperiod, setTimeperiod] = useState({
    date_start: getStartDate(6, "days"),
    date_end: getEndDate(),
    label: "Last 7 days",
    value: "7days"
  });
  const overviewMetadata = {
    "Organisation hash": orgData.orgHash,
    "Organisation name": orgData.orgName,
    "Number of users": orgData.usersNumber,
    Status: orgData.status,
    Subscription: orgData.subscription
  };
  const cardContentStyle = { heightX: 200, width: 600 };
  const tabs = [
    {
      label: "OVERVIEW",
      content: /* @__PURE__ */ React.createElement(Grid, {
        container: true,
        spacing: 3,
        direction: "column",
        style: cardContentStyle
      }, /* @__PURE__ */ React.createElement(Grid, {
        item: true
      }, /* @__PURE__ */ React.createElement(InfoCard, {
        title: "Organisation's Details"
      }, /* @__PURE__ */ React.createElement(StructuredMetadataTable, {
        metadata: overviewMetadata
      }))))
    },
    {
      label: "SPRINT INSIGHTS",
      content: /* @__PURE__ */ React.createElement(Grid, {
        container: true,
        spacing: 3,
        direction: "column"
      }, /* @__PURE__ */ React.createElement(Grid, {
        item: true
      }, /* @__PURE__ */ React.createElement(AaSprintInsightsPage, {
        timeperiod
      })))
    },
    {
      label: "SLOS",
      content: /* @__PURE__ */ React.createElement(Grid, {
        container: true,
        spacing: 3,
        direction: "column"
      }, /* @__PURE__ */ React.createElement(Grid, {
        item: true
      }, /* @__PURE__ */ React.createElement(AaSlosPage, {
        timeperiod
      })))
    },
    {
      label: "ERROR BUDGETS",
      content: /* @__PURE__ */ React.createElement(Grid, {
        container: true,
        spacing: 3,
        direction: "column"
      }, /* @__PURE__ */ React.createElement(Grid, {
        item: true
      }, /* @__PURE__ */ React.createElement(AaErrorBudgetsPage, {
        timeperiod
      })))
    },
    {
      label: "DORA",
      content: /* @__PURE__ */ React.createElement(Grid, {
        container: true,
        spacing: 3,
        direction: "column"
      }, /* @__PURE__ */ React.createElement(Grid, {
        item: true
      }, /* @__PURE__ */ React.createElement(AaDoraPage, {
        timeperiod
      })))
    },
    {
      label: "KUDOS",
      content: /* @__PURE__ */ React.createElement(Grid, {
        container: true,
        spacing: 3,
        direction: "column"
      }, /* @__PURE__ */ React.createElement(Grid, {
        item: true
      }, /* @__PURE__ */ React.createElement(AaKudosPage, {
        timeperiod
      })))
    },
    {
      label: "STOCK",
      content: /* @__PURE__ */ React.createElement(Grid, {
        container: true,
        spacing: 3,
        direction: "column"
      }, /* @__PURE__ */ React.createElement(Grid, {
        item: true
      }, /* @__PURE__ */ React.createElement(AaStockPage, {
        timeperiod
      })))
    },
    {
      label: "LEAKS",
      content: /* @__PURE__ */ React.createElement(Grid, {
        container: true,
        spacing: 3,
        direction: "column"
      }, /* @__PURE__ */ React.createElement(Grid, {
        item: true
      }, /* @__PURE__ */ React.createElement(AaLeaksPage, {
        timeperiod
      })))
    }
  ];
  return /* @__PURE__ */ React.createElement(Content, null, /* @__PURE__ */ React.createElement(Grid, {
    container: true,
    spacing: 3,
    direction: "column"
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true
  }, /* @__PURE__ */ React.createElement(Grid, {
    item: true
  }, /* @__PURE__ */ React.createElement(AaTimeSelect, {
    timeperiod,
    setTimeperiod
  }))), /* @__PURE__ */ React.createElement(Grid, {
    item: true
  }, /* @__PURE__ */ React.createElement(Tabs, {
    tabs
  }))));
};

const AaMainPageComponent = () => {
  var _a, _b;
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const organisationState = useAsync(async () => {
    const response = await api.getOrganisationData({
      orgHash,
      apiKey
    });
    return response;
  }, []);
  return /* @__PURE__ */ React.createElement(Page, {
    themeId: "tool"
  }, /* @__PURE__ */ React.createElement(Header, {
    title: ((_a = organisationState == null ? void 0 : organisationState.value) == null ? void 0 : _a.orgName) ? organisationState.value.orgName.trim() : "Agile Analytics",
    subtitle: `${((_b = organisationState == null ? void 0 : organisationState.value) == null ? void 0 : _b.orgName) ? organisationState.value.orgName.trim() : "Your company"}'s essential metrics from Agile Analytics`
  }, /* @__PURE__ */ React.createElement(HeaderLabel, {
    label: "Owner",
    value: "Zen Software"
  }), /* @__PURE__ */ React.createElement(HeaderLabel, {
    label: "Lifecycle",
    value: "Alpha"
  })), (organisationState == null ? void 0 : organisationState.loading) ? /* @__PURE__ */ React.createElement(Progress, null) : null, (organisationState == null ? void 0 : organisationState.error) ? /* @__PURE__ */ React.createElement(Alert, {
    severity: "error"
  }, organisationState == null ? void 0 : organisationState.error.message) : null, !organisationState.loading && !organisationState.error ? /* @__PURE__ */ React.createElement(AaContentComponent, {
    orgData: organisationState == null ? void 0 : organisationState.value
  }) : null);
};

export { AaMainPageComponent };
//# sourceMappingURL=index-6fc5986a.esm.js.map
