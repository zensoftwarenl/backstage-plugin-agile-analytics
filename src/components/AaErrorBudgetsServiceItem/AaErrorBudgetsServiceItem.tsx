/* eslint-disable no-console */
import { InfoCard, Progress } from '@backstage/core-components';
import {
  Service,

  SingleServiceDataResponse,
  SloHistoryDataResponse,
  Timeperiod,
} from '../../api/types';
import { Typography } from '@material-ui/core';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { AaErrorBudgetsChart } from '../AaErrorBudgetsChart';

export const AaErrorBudgetsServiceItem = ({
  timeperiod,
  service,
  deploymentsList
}: {
  timeperiod: Timeperiod;
  service: Service;
  deploymentsList: any[]
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  const { date_start: dateTimeStart, date_end: dateTimeEnd } = timeperiod;

  const singleServicesState =
    useAsync(async (): Promise<SingleServiceDataResponse> => {
      const response = await api.getSingleServiceData({
        orgHash,
        apiKey,
        serviceName: service.service,
      });
      return response;
    }, [service]);

  const chartDataState = useAsync(async (): Promise<SloHistoryDataResponse> => {
    let response: { data?: any; status: number; error: string } = {
      data: null,
      status: 204,
      error: '',
    };

    if (singleServicesState?.value?.features?.length) {
      try {
        const values = await Promise.allSettled(
          singleServicesState?.value?.features.map(featureItem =>
            api.getErrorBudgetChartData({
              orgHash,
              apiKey,
              serviceName: service.service,
              feature: featureItem.feature_name,
              date_start: dateTimeStart,
              date_end: dateTimeEnd,
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

            response = {
              ...response,
              data: values
                .filter(value => value.status === 'fulfilled')
                .map(value => (value.value ? value.value : undefined))
                .filter(value => value !== undefined),
              status: 200,
            };
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
    return response;
  }, [singleServicesState?.value]);

  if (singleServicesState?.loading || chartDataState?.loading) {
    return <Progress />;
  } else if (singleServicesState?.error || chartDataState?.error) {
    return (
      <Alert severity="error">
        {singleServicesState?.error?.message ?? chartDataState?.error?.message}
      </Alert>
    );
  } else if (!singleServicesState?.value || !chartDataState?.value) {
    return <Typography component="p">No data</Typography>;
  }

  return (
    <InfoCard
      title={`Service: ${service?.service}`}
      subheader={`Operational dashboard URL: ${service?.url}`}
    >
      {!singleServicesState?.value?.features?.length ? (
        <Typography component="p">No Error budgets data</Typography>
      ) : (
        <AaErrorBudgetsChart
          timeperiod={timeperiod}
          selectedService={service?.service}
          serviceState={singleServicesState?.value}
          step="24 hours"
          chartState={chartDataState?.value}
          deploymentsList={deploymentsList}
        />
      )}
    </InfoCard>
  );
};
