/* eslint-disable no-console */
import React, { useState, useEffect, useCallback } from 'react';
import { Progress } from '@backstage/core-components';
import {
  ServicesDataResponse,
  Timeperiod,
} from '../../api/types';
import { Box, Typography } from '@material-ui/core';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import { AaSloServiceItem } from '../AaSloServiceItem';
import Alert from '@material-ui/lab/Alert';

export const AaSlosPage = ({ timeperiod }: { timeperiod: Timeperiod }) => {
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

  if (servicesState?.loading) {
    return <Progress />;
  } else if (servicesState?.error) {
    return <Alert severity="error">{servicesState?.error.message}</Alert>;
  } else if (!servicesState?.value?.length) {
    return <Typography component="p">No services find</Typography>;
  }


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {servicesState?.value?.map(item => (
        <Box sx={{marginBottom:'24px'}}>
          <AaSloServiceItem timeperiod={timeperiod} service={item} />
        </Box>
      ))}
    </Box>
  );
};
