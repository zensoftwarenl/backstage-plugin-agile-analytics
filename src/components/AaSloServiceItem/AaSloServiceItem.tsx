/* eslint-disable no-console */
import { InfoCard, Progress } from '@backstage/core-components';
import {
  Service,
  SingleServiceDataResponse,
  Timeperiod,
} from '../../api/types';
import { Grid, Typography } from '@material-ui/core';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { AaSloServiceSloCard } from '../AaSloServiceSloCard';

export const AaSloServiceItem = ({
  timeperiod,
  service,
  orgHash,
  apiKey,
}: {
  timeperiod: Timeperiod;
  service: Service;
  orgHash: string;
  apiKey: string;
}) => {
  const api = useApi(agileAnalyticsApiRef);

  const singleServicesState =
    useAsync(async (): Promise<SingleServiceDataResponse> => {
      const response = await api.getSingleServiceData({
        orgHash,
        apiKey,
        serviceName: service.service,
      });
      return response;
    }, [service]);

  if (singleServicesState?.loading) {
    return <Progress />;
  } else if (singleServicesState?.error) {
    return <Alert severity="error">{singleServicesState?.error.message}</Alert>;
  } else if (!singleServicesState?.value) {
    return <Typography component="p">No data</Typography>;
  }
  return (
    <InfoCard
      title={`Service: ${service?.service}`}
      subheader={`Operational dashboard URL: ${service?.url}`}
    >
      {!singleServicesState?.value?.features?.length ? (
        <Typography component="p">No SLOs</Typography>
      ) : (
        <Grid container spacing={3} alignItems="stretch">
          {singleServicesState.value.features.map(feature => (
            <Grid item xs={3}>
              <AaSloServiceSloCard
                timeperiod={timeperiod}
                service={service}
                feature={feature}
                orgHash={orgHash}
                apiKey={apiKey}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </InfoCard>
  );
};
