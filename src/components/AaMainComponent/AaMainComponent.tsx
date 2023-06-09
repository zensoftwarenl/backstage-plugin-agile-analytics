import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
  Progress,
} from '@backstage/core-components';
import { ExampleFetchComponent } from '../ExampleFetchComponent';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { AaContentComponent } from '../AaContentComponent';

export const AaMainComponent = () => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  const organisationState = useAsync(async (): Promise<any> => {
    const response = await api.getOrganisationData({
      orgHash,
      apiKey,
    });
    return response;
  }, []);

  return (
    <Page themeId="tool">
      <Header
        // title="Agile Analytics"
        title={
          organisationState?.value?.orgName
            ? organisationState.value.orgName.trim()
            : 'Agile Analytics'
        }
        subtitle={`${
          organisationState?.value?.orgName
            ? organisationState.value.orgName.trim()
            : 'Your company'
        }'s essential metrics from Agile Analytics`}
      >
        <HeaderLabel label="Owner" value="Zen Software" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      {organisationState?.loading ? <Progress /> : null}
      {organisationState?.error ? (
        <Alert severity="error">{organisationState?.error.message}</Alert>
      ) : null}
      {!organisationState.loading && !organisationState.error ? (
        <AaContentComponent orgData={organisationState?.value} />
      ) : null}
    </Page>
  );
};
