/* eslint-disable no-console */
import React, { useState } from 'react';
import { Grid } from '@material-ui/core';
import {
  Content,
  InfoCard,
  StructuredMetadataTable,
  Tabs,
} from '@backstage/core-components';
import { OrganisationDataResponse } from '../../api/types';
import { AaTimeSelect } from '../AaTimeSelect';
import { getEndDate, getStartDate } from '../../helpers';
import { AaDoraPage } from '../AaDoraPage';
import { AaSprintInsightsPage } from '../AaSprintInsightsPage';
import { AaStockPage } from '../AaStockPage';
import { AaLeaksPage } from '../AaLeaksPage';
import { AaSlosPage } from '../AaSlosPage';
import { AaErrorBudgetsPage } from '../AaErrorBudgetsPage';
import { AaKudosPage } from '../AaKudosPage';

export const AaContentComponent = ({
  orgData,
}: {
  orgData: OrganisationDataResponse;
}) => {
  const [timeperiod, setTimeperiod] = useState({
    date_start: getStartDate(6, 'days'),
    date_end: getEndDate(),
    label: 'Last 7 days',
    value: '7days',
  });

  const overviewMetadata = {
    'Organisation hash': orgData.orgHash,
    'Organisation name': orgData.orgName,
    'Number of users': orgData.usersNumber,
    Status: orgData.status,
    Subscription: orgData.subscription,
  };

  const cardContentStyle = { heightX: 200, width: 600 };
  const tabs = [
    {
      label: 'OVERVIEW',
      content: (
        <Grid container spacing={3} direction="column" style={cardContentStyle}>
          <Grid item>
            <InfoCard title="Organisation's Details">
              <StructuredMetadataTable metadata={overviewMetadata} />
            </InfoCard>
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'SPRINT INSIGHTS',
      content: (
        <Grid container spacing={3} direction="column">
          <Grid item>
            <AaSprintInsightsPage timeperiod={timeperiod} />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'SLOS',
      content: (
        <Grid container spacing={3} direction="column">
          <Grid item>
            <AaSlosPage timeperiod={timeperiod} />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'ERROR BUDGETS',
      content: (
        <Grid container spacing={3} direction="column">
          <Grid item>
            <AaErrorBudgetsPage timeperiod={timeperiod} />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'DORA',
      content: (
        <Grid container spacing={3} direction="column">
          <Grid item>
            <AaDoraPage timeperiod={timeperiod} />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'KUDOS',
      content: (
        <Grid container spacing={3} direction="column">
          <Grid item>
            <AaKudosPage timeperiod={timeperiod} />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'STOCK',
      content: (
        <Grid container spacing={3} direction="column">
          <Grid item>
            <AaStockPage timeperiod={timeperiod} />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'LEAKS',
      content: (
        <Grid container spacing={3} direction="column">
          <Grid item>
            <AaLeaksPage timeperiod={timeperiod} />
          </Grid>
        </Grid>
      ),
    },
  ];

  return (
    <Content className='content-container'>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <Grid item>
            <AaTimeSelect
              timeperiod={timeperiod}
              setTimeperiod={setTimeperiod}
            />
          </Grid>
        </Grid>
        <Grid item>
          <Tabs tabs={tabs} />
        </Grid>
      </Grid>
    </Content>
  );
};
