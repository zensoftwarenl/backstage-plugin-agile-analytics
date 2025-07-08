/* eslint-disable no-console */
import React from 'react';
import { GaugeCard, InfoCard, Progress } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { Grid } from '@material-ui/core';
import { Timeperiod } from '../../api/types';
import { agileAnalyticsApiRef } from '../../api';
import { AaSprintInsightsTable } from '../AaSprintInsightsTable';

export const AaSprintInsightsPage = ({
  timeperiod,
}: {
  timeperiod: Timeperiod;
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  const siState = useAsync(async (): Promise<any> => {
    const response = await api.getSiData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end,
    });
    return response;
  }, [timeperiod]);

  if (siState?.loading) {
    return <Progress />;
  } else if (siState?.error) {
    return <Alert severity="error">{siState?.error.message}</Alert>;
  }

  const ticketsTotal: number =
    siState.value.featuresAmount + siState.value.notFeaturesAmount;
  const featuresPart = siState.value.featuresAmount / ticketsTotal;
  const notFeaturesPart = siState.value.notFeaturesAmount / ticketsTotal;

  const timeTotal: number =
    siState.value.featuresTime + siState.value.notFeaturesTime;
  const featuresTimePart = siState.value.featuresTime / timeTotal;
  const notFeaturesTimePart = siState.value.notFeaturesTime / timeTotal;

  return (
    <Grid container spacing={2}>
      <Grid item>
        <InfoCard
          title="Feature - not feature"
          subheader="How many features and not-feature tasks are in development"
        >
          <Grid container spacing={2}>
            <Grid item>
              <GaugeCard
                title="Features"
                progress={featuresPart}
                description={`${siState.value.featuresAmount} tickets`}
              />
            </Grid>

            <Grid item>
              <GaugeCard
                title="Not features"
                progress={notFeaturesPart}
                description={`${siState.value.notFeaturesAmount} tickets`}
              />
            </Grid>
          </Grid>
        </InfoCard>
      </Grid>
      <Grid item>
        <InfoCard
          title="Time spent"
          subheader="How much time were spent on features and not-feature tasks"
        >
          <Grid container spacing={2}>
            <Grid item>
              <GaugeCard
                title="Features"
                progress={featuresTimePart}
                description={`${siState.value.featuresTime} hours spent`}
              />
            </Grid>

            <Grid item>
              <GaugeCard
                title="Not features"
                progress={notFeaturesTimePart}
                description={`${siState.value.notFeaturesTime} hours spent`}
              />
            </Grid>
          </Grid>
        </InfoCard>
      </Grid>
      <AaSprintInsightsTable
        timeperiod={timeperiod}
        tickets={siState.value.tickets}
      />
    </Grid>
  );
};
