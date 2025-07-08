/* eslint-disable no-console */
import React, { useState, useEffect, useCallback } from 'react';
import { InfoCard, Progress } from '@backstage/core-components';
import {
  Deployment,
  DeploymentFreqResponse,
  FilterRepo,
  Repo,
  Timeperiod,
} from '../../api/types';
import { Chip, Grid } from '@material-ui/core';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { AaDoraChart } from '../AaDoraChart';
import moment from 'moment';

export const AaDoraPage = ({ timeperiod }: { timeperiod: Timeperiod }) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  // =======FILTER  SETUP========
  const reposState = useAsync(async (): Promise<any> => {
    const response = await api.getReposData({
      orgHash,
      apiKey,
    });
    return response;
  }, []);

  const [repositoriesFilter, setRepositoriesFilter] = useState<FilterRepo[]>(
    [],
  );
  const [update, setUpdate] = useState<number>(0);

  // formatting All repositories for the filter (adding isSelected: true/false)
  useEffect(() => {
    if (reposState?.value?.length) {
      const formatted = reposState?.value
        .reduce((acc: FilterRepo[], item: Repo) => {
          const group = item.provider_id;
          const options = item.repositories.map(repository => {
            return {
              ...repository,
              group: group,
              isSelected: repository?.webhook ?? false,
            };
          });
          return [...acc, ...options];
        }, [])
        .filter((repo: FilterRepo) => repo.webhook);

      setRepositoriesFilter(formatted);
    } else {
      setRepositoriesFilter([]);
    }
  }, [reposState.value]);

  // ============= GENERAL DORA CHARTS SETUP===================
  const [timeperiodByDays, setTimeperiodByDays] = useState<
    { start: number; end: number }[]
  >([]);

  useEffect(() => {
    if (timeperiod.date_start && timeperiod.date_end) {
      const timestampsByDays = [];
      let dayStartTimestamp = timeperiod.date_start * 1000;
      let dayEndTimestamp = +moment(dayStartTimestamp)
        .add(1, 'days')
        .subtract(1, 'seconds')
        .format('x');

      while (dayEndTimestamp < timeperiod.date_end * 1000) {
        timestampsByDays.push({
          start: dayStartTimestamp,
          end: dayEndTimestamp,
        });
        dayStartTimestamp = +moment(dayStartTimestamp)
          .add(1, 'days')
          .format('x');
        dayEndTimestamp = +moment(dayEndTimestamp).add(1, 'days').format('x');
      }

      timestampsByDays.push({
        start: dayStartTimestamp,
        end: dayEndTimestamp,
      });

      setTimeperiodByDays(timestampsByDays);
    }
  }, [timeperiod]);

  // ===================DEPLOYMENT FREQUENCY SETUP=============================
  const deploymentFreqState = useAsync(async (): Promise<any> => {
    const response = await api.getDeploymentFreqData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end,
    });
    return response;
  }, [timeperiod]);

  const [filteredDeploymentFreqData, setFilteredDeploymentFreqData] =
    useState<any>([]);
  const [formattedDeploymentFreqData, setFormattedDeploymentFreqData] =
    useState<any>([]);
  const [
    formattedDeploymentFreqSuccessData,
    setFormattedDeploymentFreqSuccessData,
  ] = useState<any>([]);
  const [
    formattedDeploymentFreqFailedData,
    setFormattedDeploymentFreqFailedData,
  ] = useState<any>([]);
  const [averageDeploymentFreq, setAverageDeploymentFreq] = useState<
    string | null
  >(null);

  const chartsDeploymentFreq = [
    {
      title: {
        label: 'Deployment frequency',
        value: 'deployment-frequency',
      },
      averageMeasure: 'p/day',
      averageValue: averageDeploymentFreq,
      series: [
        {
          name: 'Successful deployments',
          data: formattedDeploymentFreqSuccessData
            ? formattedDeploymentFreqSuccessData
            : [],
        },
        {
          name: 'Failed deployments',
          data: formattedDeploymentFreqFailedData
            ? formattedDeploymentFreqFailedData
            : [],
        },
      ],
    },
  ];

  const filterDeploymentFreq = useCallback(
    data => {
      const filteredData = data.filter((deployment: Deployment) => {
        return repositoriesFilter.find(
          repo =>
            repo.isSelected &&
            repo.url.includes(
              deployment?.repository?.replace('git@gitlab.com:', ''),
            ),
        );
      });
      return filteredData;
    },
    [repositoriesFilter],
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
    (status = 'success') => {
      return timeperiodByDays.reduce((acc: number[][], day, i) => {
        let deployments = filteredDeploymentFreqData.filter(
          (deployment: Deployment) =>
            deployment.timestamp * 1000 >= day.start &&
            deployment.timestamp * 1000 <= day.end,
        );

        if (status) {
          deployments = deployments.filter(
            (deployment: Deployment) => deployment.status === status,
          );
        }

        if (i === timeperiodByDays?.length - 1) {
          return [
            ...acc,
            [day.start, deployments.length],
            [day.end, deployments.length],
          ];
        }
        return [...acc, [day.start, deployments.length]];
      }, []);
    },
    [filteredDeploymentFreqData, timeperiodByDays],
  );

  useEffect(() => {
    if (filteredDeploymentFreqData?.length) {
      setFormattedDeploymentFreqSuccessData(formatDeploymentFreq('success'));
      setFormattedDeploymentFreqFailedData(formatDeploymentFreq('failed'));
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
        (acc: number, item: number[], i: number) =>
          formattedDeploymentFreqData.length - 1 !== i ? acc + item[1] : acc,
        0,
      );
      const avgDeployments = (
        totalDeployments / timeperiodByDays.length
      ).toFixed(2);
      setAverageDeploymentFreq(avgDeployments);
    } else {
      setAverageDeploymentFreq(null);
    }
  }, [formattedDeploymentFreqData, timeperiodByDays, repositoriesFilter]);

  function handleRepoToggle(repo: FilterRepo) {
    const updatedRepos: FilterRepo[] = repositoriesFilter.map(
      (filterRepo: FilterRepo) => {
        if (filterRepo.url === repo.url) {
          return { ...filterRepo, isSelected: !filterRepo.isSelected };
        }
        return filterRepo;
      },
    );
    setRepositoriesFilter(updatedRepos);
  }

  // =============== LEAD/CYCLE TIME SETUP ========================

  const leadTimeState = useAsync(async (): Promise<any> => {
    const response = await api.getLeadTimeData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end,
    });
    return response;
  }, [timeperiod]);

  const [filteredLeadTimeData, setFilteredLeadTimeData] = useState<any[]>([]);
  const [formattedLeadTimeData, setFormattedLeadTimeData] = useState<
    number[][]
  >([]);
  const [ticketKeys, setTicketKeys] = useState<string[]>([]);
  const [formattedLeadTimeForChangeData, setFormattedLeadTimeForChangeData] =
    useState<number[][]>([]);
  const [formattedCycleTimeData, setFormattedCycleTimeData] = useState<
    number[][]
  >([]);
  const [averageCycleTimeChartData, setAverageCycleTimeChartData] = useState<
    any[]
  >([]);
  const [averageLeadTimeChartData, setAverageLeadTimeChartData] = useState<
    any[]
  >([]);
  const [
    averageLeadTimeForChangeChartData,
    setAverageLeadTimeForChangeChartData,
  ] = useState<any[]>([]);
  const [averageCycleTime, setAverageCycleTime] = useState<{
    cycleTime: string | null;
    leadTime: string | null;
    leadTimeForChange: string | null;
  } | null>(null);
  const chartsLeadTime = [
    {
      title: {
        value: 'cycle-time',
        label: 'Cycle Time',
      },
      description:
        'Measures the time difference between the starting time of implementing a requirement and when the changes are delivered to production.',
      averageMeasure: '',
      averageValue: averageCycleTime?.cycleTime,
      series: [
        {
          name: 'Deployments Cycle Time',
          type: 'scatter',
          data: formattedCycleTimeData?.length ? formattedCycleTimeData : [],
        },

        {
          name: 'Average',
          type: 'line',
          data: averageCycleTimeChartData?.length
            ? averageCycleTimeChartData
            : [],
        },
      ],
    },
    {
      title: {
        value: 'lead-time',
        label: 'Lead Time',
      },
      description:
        'Measures the time difference between the time a requirement is created and when the changes are delivered to production.',
      averageMeasure: '',
      averageValue: averageCycleTime?.leadTime,
      series: [
        {
          name: 'Deployments Lead Time',
          type: 'scatter',
          data: formattedLeadTimeData.length ? formattedLeadTimeData : [],
        },

        {
          name: 'Average',
          type: 'line',
          data: averageLeadTimeChartData.length ? averageLeadTimeChartData : [],
        },
      ],
    },
    {
      title: {
        value: 'lead-time-for-change',
        label: 'Lead Time for Changes',
      },
      description:
        'Measures the amount of time it takes a commit to get into production.',
      averageMeasure: '',
      averageValue: averageCycleTime?.leadTimeForChange,
      series: [
        {
          name: 'Deployments Lead Time For Changes',
          type: 'scatter',
          data: formattedLeadTimeForChangeData.length
            ? formattedLeadTimeForChangeData
            : [],
        },

        {
          name: 'Average',
          type: 'line',
          data: averageLeadTimeForChangeChartData.length
            ? averageLeadTimeForChangeChartData
            : [],
        },
      ],
    },
  ];

  // FILTER API RESPONCE
  useEffect(() => {
    if (leadTimeState?.value?.length) {
      const filteredData = filterDeploymentFreq(leadTimeState.value);
      setFilteredLeadTimeData(filteredData);
    } else {
      setFilteredLeadTimeData([]);
    }
  }, [leadTimeState?.value, repositoriesFilter, filterDeploymentFreq]);

  // FORMAT FILTERED  API RESPONSE
  const formatLeadTimeData = useCallback(
    (propertyKey: string) => {
      return filteredLeadTimeData.map(deployment => [
        deployment.timestamp * 1000,
        deployment[propertyKey] * 1000, // the value comes in seconds, convert to milliseconds
      ]);
    },
    [filteredLeadTimeData],
  );

  useEffect(() => {
    if (filteredLeadTimeData?.length) {
      setFormattedLeadTimeData(formatLeadTimeData('lead_time'));
      setFormattedCycleTimeData(formatLeadTimeData('cycle_time'));
      setFormattedLeadTimeForChangeData(
        formatLeadTimeData('lead_time_for_changes'),
      );
      setTicketKeys(filteredLeadTimeData.map(item => item.key));
    } else {
      setFormattedLeadTimeData([]);
      setFormattedCycleTimeData([]);
      setFormattedLeadTimeForChangeData([]);
      setTicketKeys([]);
    }
  }, [filteredLeadTimeData, formatLeadTimeData, update]);

  // SET AVERAGE
  const generateAverageChart = useCallback(
    formattedData => {
      return timeperiodByDays.reduce((acc: number[][], day, i) => {
        const dayDeployments = formattedData.filter(
          (deployment: number[]) =>
            deployment[0] >= day.start && deployment[0] <= day.end,
        );

        const dayAverage = dayDeployments?.length
          ? dayDeployments.reduce(
              (accum: number, event: number[]) => accum + event[1],
              0,
            ) / dayDeployments?.length
          : null;

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
            [day.end, dayAverage],
          ];
        }
        return [...acc, [day.end, dayAverage]];
      }, []);
    },
    [timeperiodByDays],
  );

  const formatChartAxisTime = useCallback((value: number) => {
    const valueDuration: ValueDuration = moment.duration(value);
    let formattedValue = '0';

    if (value !== 0) {
      if (valueDuration._data.months) {
        formattedValue = `${Math.floor(valueDuration.asDays())}d`;
      } else if (valueDuration._data.days) {
        formattedValue = `${valueDuration._data.days}d ${
          valueDuration._data.minutes >= 30
            ? valueDuration._data.hours + 1
            : valueDuration._data.hours
        }h`;
      } else if (valueDuration._data.hours) {
        formattedValue = `${valueDuration._data.hours}h ${
          valueDuration._data.seconds >= 30
            ? valueDuration._data.minutes + 1
            : valueDuration._data.minutes
        }m`;
      } else if (valueDuration._data.minutes) {
        formattedValue = `${valueDuration._data.minutes}m ${
          valueDuration._data.milliseconds >= 30
            ? valueDuration._data.seconds + 1
            : valueDuration._data.seconds
        }s`;
      } else if (valueDuration._data.seconds) {
        formattedValue = `${
          valueDuration._data.milliseconds >= 30
            ? valueDuration._data.seconds + 1
            : valueDuration._data.seconds
        }s`;
      }
    }

    return formattedValue;
  }, []);

  useEffect(() => {
    // calculate average number per timepareiod
    let avgCycleTime: string | null = null;
    let avgLeadTime: string | null = null;
    let avgLeadTimeForChange: string | null = null;

    const totalCycleTime = formattedCycleTimeData?.length
      ? formattedCycleTimeData.reduce((acc, item) => acc + item[1], 0)
      : null;
    const totalLeadTime = formattedLeadTimeData?.length
      ? formattedLeadTimeData.reduce((acc, item) => acc + item[1], 0)
      : null;

    const totalLeadTimeForChange = formattedLeadTimeForChangeData?.length
      ? formattedLeadTimeForChangeData.reduce((acc, item) => acc + item[1], 0)
      : null;

    if (totalCycleTime) {
      avgCycleTime = formatChartAxisTime(
        totalCycleTime / formattedCycleTimeData.length,
      );
    }
    if (totalLeadTime) {
      avgLeadTime = formatChartAxisTime(
        totalLeadTime / formattedLeadTimeData.length,
      );
    }
    if (totalLeadTimeForChange) {
      avgLeadTimeForChange = formatChartAxisTime(
        totalLeadTimeForChange / formattedLeadTimeForChangeData.length,
      );
    }

    setAverageCycleTime({
      cycleTime: avgCycleTime,
      leadTime: avgLeadTime,
      leadTimeForChange: avgLeadTimeForChange,
    });

    // calculate average chart data (avarage for every day in the timeperiod)
    setAverageCycleTimeChartData(generateAverageChart(formattedCycleTimeData));
    setAverageLeadTimeChartData(generateAverageChart(formattedLeadTimeData));
    setAverageLeadTimeForChangeChartData(
      generateAverageChart(formattedLeadTimeForChangeData),
    );
  }, [
    formattedLeadTimeData,
    formattedCycleTimeData,
    formattedLeadTimeForChangeData,
    generateAverageChart,
    formatChartAxisTime,
  ]);

  interface ValueDuration extends moment.Duration {
    _data?: any;
  }

  if (reposState?.loading) {
    return <Progress />;
  } else if (reposState?.error) {
    return <Alert severity="error">{reposState?.error.message}</Alert>;
  }

  return (
    <InfoCard title="DORA Metrics">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={4} lg={2}>
          <InfoCard title="Repositories">
            {repositoriesFilter
              .filter((repo: FilterRepo) => repo.isSelected)
              .map((repo: FilterRepo) => (
                <Chip
                  label={repo.name}
                  key={repo.url}
                  size="small"
                  onDelete={() => handleRepoToggle(repo)}
                />
              ))}
            {repositoriesFilter
              .filter((repo: FilterRepo) => !repo.isSelected)
              .map((repo: FilterRepo) => (
                <Chip
                  label={repo.name}
                  key={repo.url}
                  size="small"
                  variant="outlined"
                  onClick={() => handleRepoToggle(repo)}
                />
              ))}
          </InfoCard>
        </Grid>
        <Grid item xs={8} lg={10}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <AaDoraChart
                timeperiod={timeperiod}
                charts={chartsDeploymentFreq}
                chartColor={['#3090B3', '#FFA1B5']}
                chartHeight={360}
                loading={deploymentFreqState.loading}
                customPointFormatter={null}
                customOptions={null}
                yAxisFormatter={null}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <AaDoraChart
                timeperiod={timeperiod}
                charts={chartsLeadTime}
                chartColor={['#FF6384', '#333333']}
                yAxisFormatter={function (this: any) {
                  const formattedValue: string = formatChartAxisTime(
                    this.value,
                  );
                  return `<span>${formattedValue}</span>`;
                }}
                chartHeight={360}
                customPointFormatter={function (this: any) {
                  const formattedValue = formatChartAxisTime(this.options.y);

                  const keyIndex = formattedCycleTimeData.findIndex(
                    item => item[0] === this.options.x,
                  );

                  return `<span>${this.series.userOptions.name.replace(
                    'Deployments ',
                    '',
                  )}: ${formattedValue}</span><br/><span>${
                    this.series.initialType === 'scatter'
                      ? `Ticket key: ${ticketKeys[keyIndex]}`
                      : ''
                  }`;
                }}
                loading={leadTimeState.loading}
                customOptions={null}
                setUpdate={setUpdate}
                update={update}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </InfoCard>
  );
};
