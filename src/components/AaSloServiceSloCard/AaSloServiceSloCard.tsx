/* eslint-disable no-console */
import React from 'react';
import { Progress } from '@backstage/core-components';
import {
  ErrorBudgetChartDataResponse,
  Service,
  ServiceFeature,
  SloHistoryDataResponse,
  Timeperiod,
} from '../../api/types';
import { Box, Card, CardContent, CardHeader, Chip, Divider, Grid, Typography } from '@material-ui/core';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import CheckCircleOutlineOutlinedIcon from '@material-ui/icons/CheckCircleOutlineRounded';
import HighlightOff from '@material-ui/icons/HighlightOff';
import moment from 'moment';

export const AaSloServiceSloCard = ({
  timeperiod,
  service,
  feature,
}: {
  timeperiod: Timeperiod;
  service: Service;
  feature: ServiceFeature;
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  const { date_start, date_end } = timeperiod;

  const chartDataState =
    useAsync(async (): Promise<ErrorBudgetChartDataResponse> => {
      const response = await api.getErrorBudgetChartData({
        orgHash,
        apiKey,
        serviceName: service.service,
        feature: feature.feature_name,
        date_start,
        date_end,
        step_size: '24 hours',
      });
      return response;
    }, [feature, timeperiod]);

  const sloHistoryState =
    useAsync(async (): Promise<SloHistoryDataResponse> => {
      let response: { data?: any; status: number; error: string } = {
        data: null,
        status: 204,
        error: '',
      };

      if (chartDataState?.value) {
        const dates: [number, number][] = [];
        while (dates?.length < 4) {
          let week = null;
          let year = null;
          if (!dates?.length) {
            // calculate endTimestamp and startTimestamp for the current week (endTimestamp mught be in the future)
            week = moment().isoWeek();
            year = moment().year();
          } else {
            const endMomentObj = moment(
              (dates[dates?.length - 1][0] - 1) * 1000,
            );
            week = endMomentObj.isoWeek();
            year = endMomentObj.year();
          }

          // Get the start of the week (Monday)
          const weekStart = moment()
            .year(year)
            .week(week)
            .startOf('week')
            .unix();

          // Get the end of the week (Sunday)
          const weekEnd = moment().year(year).week(week).endOf('week').unix();

          dates.push([weekStart, weekEnd]);
        }

        try {
          const values = await Promise.allSettled(
            dates.map(date =>
              api.getErrorBudgetChartData({
                orgHash,
                apiKey,
                serviceName: service.service,
                feature: feature.feature_name,
                date_start: date[0],
                date_end: date[1],
                step_size: '24 hours',
              }),
            ),
          );

          if (values.length) {
            if (!values.find(value => value.status === 'fulfilled')) {
              response = {
                ...response,
                status: 404,
                error: 'error',
              };
            } else {
              let status = 200;

              if (
                !values.find(
                  value =>
                    value.status === 'fulfilled' && value.value.status !== 204,
                )
              ) {
                status = 204;
              }

              const filteredValues = values
                .filter(value => value.status === 'fulfilled')
                .map(value => (value.value.data ? value.value.data : undefined))
                .filter(value => value !== undefined);

              const calculatedSloData = filteredValues.map(item => {
                return calculateAverageSloValue(
                  item,
                  chartDataState?.value?.slo_target,
                );
              });

              response = {
                ...response,
                data: {
                  slo: calculatedSloData,
                  dates,
                },
                status: status,
              };
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
      return response;
    }, [chartDataState?.value]);

  const filteredData = filterData(chartDataState?.value?.data);

  function filterData(dataArray: [number, number][] | undefined) {
    if (!dataArray?.length) {
      return null;
    }
    // return only error budget value
    return dataArray?.map(item => item[1]);
  }

  function calculateSloValue(
    filtered: number[] | null,
    target: number | undefined,
  ) {
    // calculating SLO from error budget value: value as SLO target +/- remaining error budget
    if (!filtered?.length || !target) {
      return 0;
    }

    const latestMeasurement: number = filtered[filtered.length - 1];
    const totalErrorBudget = 1 - target;
    const avaivableErrorBudget = (totalErrorBudget * latestMeasurement) / 100;

    const slo = (target + avaivableErrorBudget) * 100;
    return slo.toFixed(3);
  }

  // simplified SLO average calc
  function calculateAverageSloValue(
    dataPoints: [number, number][],
    target?: number,
  ) {
    const slosForEachPoint = dataPoints.map(dataPoint => {
      const slo = calculateSloValue([dataPoint[1]], target);
      return +slo;
    });

    const averageSlo =
      slosForEachPoint?.reduce((acc: number, item) => +acc + +item, 0) /
      slosForEachPoint?.length;

    return averageSlo.toFixed(3);
  }

  if (chartDataState?.loading) {
    return <Progress />;
  } else if (chartDataState?.error) {
    return <Alert severity="error">{chartDataState?.error.message}</Alert>;
  } else if (!chartDataState?.value) {
    return <Typography component="p">No data</Typography>;
  }


  return (
    <Card>
      <Box sx={{ marginY: '16px', textAlign: 'center' }}>
        <Typography variant="h5">{chartDataState.value.slo_name}</Typography>
        <Typography variant="subtitle1">in the last 24 hours</Typography>
      </Box>
      <Divider aria-hidden="true" />
      <Box
        sx={{
          paddingTop: '12px',
          paddingX: '12px',
        }}
      >
        <Typography component="p" variant="h6" align="center">
          {calculateSloValue(filteredData, chartDataState.value.slo_target)
            ? `${calculateSloValue(
                filteredData,
                chartDataState?.value?.slo_target,
              )}%`
            : 'no SLO DATA'}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gridGap: '4px',
          padding: '12px',
        }}
      >
        {+calculateSloValue(filteredData, chartDataState.value.slo_target) >
        chartDataState.value.slo_target * 100 ? (
          <CheckCircleOutlineOutlinedIcon
            style={{ color: '#8ec358', fontSize: 24 }}
          />
        ) : (
          <HighlightOff style={{ color: '#c03a3a', fontSize: 24 }} />
        )}
        <Typography component="p" variant="subtitle1" align="center">
          Target: {chartDataState.value.slo_target * 100}%
        </Typography>
      </Box>
      <Divider aria-hidden="true" />
      <Box sx={{ padding: '12px' }}>
        <Typography component="p" variant="body1">
          Last 4-week history:
        </Typography>

        {sloHistoryState?.loading ? <Progress /> : null}
        {!sloHistoryState?.loading && sloHistoryState?.error ? (
          <Alert severity="error">Faled to load SLO's history</Alert>
        ) : null}
        {!sloHistoryState?.loading &&
        !sloHistoryState?.error &&
        !sloHistoryState?.value?.data?.slo?.length ? (
          <Typography component="p" variant="body1">
            No data
          </Typography>
        ) : null}
        {!sloHistoryState?.loading &&
        !sloHistoryState?.error &&
        sloHistoryState?.value?.data?.slo?.length ? (
          <Grid container spacing={2}>
            {sloHistoryState?.value?.data?.slo?.map(slo => (
              <Grid item xs={3}>
                <Box
                  sx={{
                    padding: '2px',
                    bgcolor: `${
                      +slo >= chartDataState.value.slo_target * 100
                        ? '#8ec358'
                        : '#c03a3a'
                    }`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#fff',
                  }}
                >
                  {slo}
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : null}
      </Box>
    </Card>
  );
};
