import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect, useCallback } from 'react';
import { Progress, InfoCard } from '@backstage/core-components';
import { Grid, Chip } from '@material-ui/core';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { AaDoraChart } from '../AaDoraChart/AaDoraChart.esm.js';
import moment from 'moment';

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
  const [repositoriesFilter, setRepositoriesFilter] = useState(
    []
  );
  const [update, setUpdate] = useState(0);
  useEffect(() => {
    if (reposState?.value?.length) {
      const formatted = reposState?.value.reduce((acc, item) => {
        const group = item.provider_id;
        const options = item.repositories.map((repository) => {
          return {
            ...repository,
            group,
            isSelected: repository?.webhook ?? false
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
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end
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
  const filterDeploymentFreq = useCallback(
    (data) => {
      const filteredData = data.filter((deployment) => {
        return repositoriesFilter.find(
          (repo) => repo.isSelected && repo.url.includes(
            deployment?.repository?.replace("git@gitlab.com:", "")
          )
        );
      });
      return filteredData;
    },
    [repositoriesFilter]
  );
  useEffect(() => {
    if (deploymentFreqState?.value?.length) {
      const filteredData = filterDeploymentFreq(deploymentFreqState.value);
      setFilteredDeploymentFreqData(filteredData);
    } else {
      setFilteredDeploymentFreqData([]);
    }
  }, [deploymentFreqState, filterDeploymentFreq]);
  const formatDeploymentFreq = useCallback(
    (status = "success") => {
      return timeperiodByDays.reduce((acc, day, i) => {
        let deployments = filteredDeploymentFreqData.filter(
          (deployment) => deployment.timestamp * 1e3 >= day.start && deployment.timestamp * 1e3 <= day.end
        );
        if (status) {
          deployments = deployments.filter(
            (deployment) => deployment.status === status
          );
        }
        if (i === timeperiodByDays?.length - 1) {
          return [
            ...acc,
            [day.start, deployments.length],
            [day.end, deployments.length]
          ];
        }
        return [...acc, [day.start, deployments.length]];
      }, []);
    },
    [filteredDeploymentFreqData, timeperiodByDays]
  );
  useEffect(() => {
    if (filteredDeploymentFreqData?.length) {
      setFormattedDeploymentFreqSuccessData(formatDeploymentFreq("success"));
      setFormattedDeploymentFreqFailedData(formatDeploymentFreq("failed"));
      setFormattedDeploymentFreqData(formatDeploymentFreq());
    } else {
      setFormattedDeploymentFreqSuccessData([]);
      setFormattedDeploymentFreqFailedData([]);
      setFormattedDeploymentFreqData([]);
    }
  }, [filteredDeploymentFreqData?.length, formatDeploymentFreq]);
  useEffect(() => {
    if (formattedDeploymentFreqData?.length) {
      const totalDeployments = formattedDeploymentFreqData.reduce(
        (acc, item, i) => formattedDeploymentFreqData.length - 1 !== i ? acc + item[1] : acc,
        0
      );
      const avgDeployments = (totalDeployments / timeperiodByDays.length).toFixed(2);
      setAverageDeploymentFreq(avgDeployments);
    } else {
      setAverageDeploymentFreq(null);
    }
  }, [formattedDeploymentFreqData, timeperiodByDays, repositoriesFilter]);
  function handleRepoToggle(repo) {
    const updatedRepos = repositoriesFilter.map(
      (filterRepo) => {
        if (filterRepo.url === repo.url) {
          return { ...filterRepo, isSelected: !filterRepo.isSelected };
        }
        return filterRepo;
      }
    );
    setRepositoriesFilter(updatedRepos);
  }
  const leadTimeState = useAsync(async () => {
    const response = await api.getLeadTimeData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end
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
      averageValue: averageCycleTime?.cycleTime,
      series: [
        {
          name: "Deployments Cycle Time",
          type: "scatter",
          data: formattedCycleTimeData?.length ? formattedCycleTimeData : []
        },
        {
          name: "Average",
          type: "line",
          data: averageCycleTimeChartData?.length ? averageCycleTimeChartData : []
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
      averageValue: averageCycleTime?.leadTime,
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
      averageValue: averageCycleTime?.leadTimeForChange,
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
    if (leadTimeState?.value?.length) {
      const filteredData = filterDeploymentFreq(leadTimeState.value);
      setFilteredLeadTimeData(filteredData);
    } else {
      setFilteredLeadTimeData([]);
    }
  }, [leadTimeState?.value, repositoriesFilter, filterDeploymentFreq]);
  const formatLeadTimeData = useCallback(
    (propertyKey) => {
      return filteredLeadTimeData.map((deployment) => [
        deployment.timestamp * 1e3,
        deployment[propertyKey] * 1e3
        // the value comes in seconds, convert to milliseconds
      ]);
    },
    [filteredLeadTimeData]
  );
  useEffect(() => {
    if (filteredLeadTimeData?.length) {
      setFormattedLeadTimeData(formatLeadTimeData("lead_time"));
      setFormattedCycleTimeData(formatLeadTimeData("cycle_time"));
      setFormattedLeadTimeForChangeData(
        formatLeadTimeData("lead_time_for_changes")
      );
      setTicketKeys(filteredLeadTimeData.map((item) => item.key));
    } else {
      setFormattedLeadTimeData([]);
      setFormattedCycleTimeData([]);
      setFormattedLeadTimeForChangeData([]);
      setTicketKeys([]);
    }
  }, [filteredLeadTimeData, formatLeadTimeData, update]);
  const generateAverageChart = useCallback(
    (formattedData) => {
      return timeperiodByDays.reduce((acc, day, i) => {
        const dayDeployments = formattedData.filter(
          (deployment) => deployment[0] >= day.start && deployment[0] <= day.end
        );
        const dayAverage = dayDeployments?.length ? dayDeployments.reduce(
          (accum, event) => accum + event[1],
          0
        ) / dayDeployments?.length : null;
        if (!dayAverage) {
          if (i === timeperiodByDays?.length - 1 && acc?.length) {
            return [...acc, [day.end, acc[acc.length - 1][1]]];
          }
          return acc;
        }
        if (!acc?.length) {
          return [
            ...acc,
            [timeperiodByDays[0].start, dayAverage],
            [day.end, dayAverage]
          ];
        }
        return [...acc, [day.end, dayAverage]];
      }, []);
    },
    [timeperiodByDays]
  );
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
    const totalCycleTime = formattedCycleTimeData?.length ? formattedCycleTimeData.reduce((acc, item) => acc + item[1], 0) : null;
    const totalLeadTime = formattedLeadTimeData?.length ? formattedLeadTimeData.reduce((acc, item) => acc + item[1], 0) : null;
    const totalLeadTimeForChange = formattedLeadTimeForChangeData?.length ? formattedLeadTimeForChangeData.reduce((acc, item) => acc + item[1], 0) : null;
    if (totalCycleTime) {
      avgCycleTime = formatChartAxisTime(
        totalCycleTime / formattedCycleTimeData.length
      );
    }
    if (totalLeadTime) {
      avgLeadTime = formatChartAxisTime(
        totalLeadTime / formattedLeadTimeData.length
      );
    }
    if (totalLeadTimeForChange) {
      avgLeadTimeForChange = formatChartAxisTime(
        totalLeadTimeForChange / formattedLeadTimeForChangeData.length
      );
    }
    setAverageCycleTime({
      cycleTime: avgCycleTime,
      leadTime: avgLeadTime,
      leadTimeForChange: avgLeadTimeForChange
    });
    setAverageCycleTimeChartData(generateAverageChart(formattedCycleTimeData));
    setAverageLeadTimeChartData(generateAverageChart(formattedLeadTimeData));
    setAverageLeadTimeForChangeChartData(
      generateAverageChart(formattedLeadTimeForChangeData)
    );
  }, [
    formattedLeadTimeData,
    formattedCycleTimeData,
    formattedLeadTimeForChangeData,
    generateAverageChart,
    formatChartAxisTime
  ]);
  if (reposState?.loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (reposState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: reposState?.error.message });
  }
  return /* @__PURE__ */ jsx(InfoCard, { title: "DORA Metrics", children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 3, alignItems: "stretch", children: [
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 4, lg: 2, children: /* @__PURE__ */ jsxs(InfoCard, { title: "Repositories", children: [
      repositoriesFilter.filter((repo) => repo.isSelected).map((repo) => /* @__PURE__ */ jsx(
        Chip,
        {
          label: repo.name,
          size: "small",
          onDelete: () => handleRepoToggle(repo)
        },
        repo.url
      )),
      repositoriesFilter.filter((repo) => !repo.isSelected).map((repo) => /* @__PURE__ */ jsx(
        Chip,
        {
          label: repo.name,
          size: "small",
          variant: "outlined",
          onClick: () => handleRepoToggle(repo)
        },
        repo.url
      ))
    ] }) }),
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 8, lg: 10, children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 3, children: [
      /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, lg: 6, children: /* @__PURE__ */ jsx(
        AaDoraChart,
        {
          timeperiod,
          charts: chartsDeploymentFreq,
          chartColor: ["#3090B3", "#FFA1B5"],
          chartHeight: 360,
          loading: deploymentFreqState.loading,
          customPointFormatter: null,
          customOptions: null,
          yAxisFormatter: null
        }
      ) }),
      /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, lg: 6, children: /* @__PURE__ */ jsx(
        AaDoraChart,
        {
          timeperiod,
          charts: chartsLeadTime,
          chartColor: ["#FF6384", "#333333"],
          yAxisFormatter: function() {
            const formattedValue = formatChartAxisTime(
              this.value
            );
            return `<span>${formattedValue}</span>`;
          },
          chartHeight: 360,
          customPointFormatter: function() {
            const formattedValue = formatChartAxisTime(this.options.y);
            const keyIndex = formattedCycleTimeData.findIndex(
              (item) => item[0] === this.options.x
            );
            return `<span>${this.series.userOptions.name.replace(
              "Deployments ",
              ""
            )}: ${formattedValue}</span><br/><span>${this.series.initialType === "scatter" ? `Ticket key: ${ticketKeys[keyIndex]}` : ""}`;
          },
          loading: leadTimeState.loading,
          customOptions: null,
          setUpdate,
          update
        }
      ) })
    ] }) })
  ] }) });
};

export { AaDoraPage };
//# sourceMappingURL=AaDoraPage.esm.js.map
