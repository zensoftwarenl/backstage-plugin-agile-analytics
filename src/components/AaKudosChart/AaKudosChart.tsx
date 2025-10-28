/* eslint-disable no-console */
import { KudosChartResponse, Timeperiod, User } from '../../api/types';
import { Progress } from '@backstage/core-components';
import { Box, Typography } from '@material-ui/core';
import Chart from 'react-google-charts';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';

export const AaKudosChart = ({
  timeperiod,
  users,
  activeTeam,
}: {
  timeperiod: Timeperiod;
  users: { data: User[] };
  activeTeam: string;
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  const { date_end, date_start } = timeperiod;

  const kudosSankeyState = useAsync(async (): Promise<KudosChartResponse> => {
    const response = await api.getTeamKudosSankeyData({
      orgHash,
      apiKey,
      team: activeTeam ? activeTeam : 'all',
      date_end,
      date_start,
    });
    return response;
  }, [timeperiod]);

  const getChartHeight = () => {
    if (kudosSankeyState?.value?.length) {
      const senders = new Set(
        kudosSankeyState?.value.map(chartDataItem => chartDataItem[0]),
      );
      const recipient = new Set(
        kudosSankeyState?.value.map(chartDataItem => chartDataItem[1]),
      );

      if (senders.size === recipient.size || senders.size > recipient.size) {
        return `${senders.size}00px`;
      }
      return `${recipient.size}00px`;
    }
    return '500px';
  };

  const getUserName = (userHash?: string | number) => {
    const hash = userHash ? `${userHash}`?.split(' ').join('') : '';

    return users?.data?.find(user => user.hash === hash)?.user_name;
  };

  const transformationData = () => {
    const newData = kudosSankeyState?.value?.map(item => {
      const nameFrom = getUserName(item[0]);
      const nameTo = `${getUserName(item[1])} `;
      const tooltipStr = `${nameFrom} gave ${item[2]} kudo(s) to ${nameTo}`;

      return [nameFrom, nameTo, item[2], tooltipStr];
    });

    return [
      ['From', 'To', 'Quantity', { type: 'string', role: 'tooltip' }],
      ...(newData?.length ? newData : []),
    ];
  };

  if (kudosSankeyState?.loading) {
    return <Progress />;
  } else if (kudosSankeyState?.error) {
    return <Alert severity="error">{kudosSankeyState?.error?.message}</Alert>;
  } else if (!kudosSankeyState?.value || !kudosSankeyState?.value?.length) {
    return <Typography component="p">No data</Typography>;
  }

  return (
    <Box>
      <Chart
        width="100%"
        height={getChartHeight()}
        chartType="Sankey"
        options={{
          sankey: {
            fontName: "'Roboto', sans-serif",
            node: {
              colors: ['#D8D95C', '#8EC358', '#EE8282', '#4C72BD', '#484A53'],

              label: {
                color: '#484A53',
                fontSize: '16',
              },
            },

            link: {
              colorMode: 'gradient',
              colors: ['#D8D95C', '#8EC358', '#EE8282', '#4C72BD', '#484A53'],
            },
          },
        }}
        loader={<div>Loading Chart</div>}
        data={transformationData()}
        rootProps={{ 'data-testid': '1' }}
      />
    </Box>
  );
};
