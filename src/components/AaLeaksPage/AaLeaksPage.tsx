/* eslint-disable no-console */
import React from 'react';
import moment from 'moment';
import { GaugeCard, InfoCard, Progress } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { Grid } from '@material-ui/core';
import { LeaksStatisticsItem, Timeperiod } from '../../api/types';
import { agileAnalyticsApiRef } from '../../api';
import { AaDoraChart } from '../AaDoraChart';

export const AaLeaksPage = ({ timeperiod }: { timeperiod: Timeperiod }) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  const leaksState = useAsync(async (): Promise<any> => {
    const response = await api.getLeaksData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end,
    });
    return response;
  }, [timeperiod]);

  const chartOptions = [
    {
      series: [
        {
          name: 'All leakes',
          data: leaksState?.value?.statistics?.length
            ? leaksState.value.statistics.map((item: LeaksStatisticsItem) => {
                return [moment(item.date).unix() * 1000, item.leaks_quantity];
              })
            : [],
        },
        {
          name: 'Solved',
          data: leaksState?.value?.statistics?.length
            ? leaksState.value.statistics.map((item: LeaksStatisticsItem) => {
                return [moment(item.date).unix() * 1000, item.leaks_fixed];
              })
            : [],
        },
      ],
    },
  ];

  if (leaksState?.loading) {
    return <Progress />;
  } else if (leaksState?.error) {
    return <Alert severity="error">{leaksState?.error.message}</Alert>;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <InfoCard
          title="Leaks"
          deepLink={{
            title: 'Go to Agile Analytics to see a detailed report  ',
            link: 'https://www.prod.agileanalytics.cloud/leaks',
          }}
        >
          <AaDoraChart
            timeperiod={timeperiod}
            charts={chartOptions}
            chartColor={['#FF6384', '#15A2BB']}
            loading={leaksState.loading}
            customPointFormatter={null}
            customOptions={null}
            yAxisFormatter={null}
            yAxisTitle="Leaks amount"
            customOpacity={1}
            isMarker={false}
            isStacking={false}
          />
        </InfoCard>
      </Grid>
    </Grid>
  );
};
