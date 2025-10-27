/* eslint-disable no-console */
import { Progress } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { Box, Typography } from '@material-ui/core';
import {
  ServicesDataResponse,
  Timeperiod,
} from '../../api/types';
import { agileAnalyticsApiRef } from '../../api';
import { AaErrorBudgetsServiceItem } from '../AaErrorBudgetsServiceItem';

export const AaErrorBudgetsPage = ({
  timeperiod,
}: {
  timeperiod: Timeperiod;
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  const servicesState = useAsync(async (): Promise<ServicesDataResponse> => {
    const response = await api.getServicesData({
      orgHash,
      apiKey,
    });
    return response;
  }, []);

   const deploymentFreqState = useAsync(async (): Promise<any> => {
      const response = await api.getDeploymentFreqData({
        orgHash,
        apiKey,
        dateStart: timeperiod?.date_start,
        dateEnd: timeperiod?.date_end,
      });
      return response;
    }, [timeperiod]);

  if (servicesState?.loading || deploymentFreqState?.loading) {
    return <Progress />;
  } else if (servicesState?.error || deploymentFreqState?.error) {
    return (
      <Alert severity="error">
        {servicesState?.error?.message
          ? servicesState?.error.message
          : deploymentFreqState?.error?.message}
      </Alert>
    );
  } else if (!servicesState?.value?.length) {
    return <Typography component="p">No services find</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {servicesState?.value?.map(item => (
        <Box sx={{ marginBottom: '24px' }}>
          <AaErrorBudgetsServiceItem timeperiod={timeperiod} service={item} deploymentsList={deploymentFreqState?.value}  />
        </Box>
      ))}
    </Box>
  );
};
