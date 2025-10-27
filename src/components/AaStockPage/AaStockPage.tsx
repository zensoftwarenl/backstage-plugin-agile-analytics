/* eslint-disable no-console */
import moment from 'moment';
import { InfoCard, Progress } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { Grid } from '@material-ui/core';
import { Timeperiod } from '../../api/types';
import { agileAnalyticsApiRef } from '../../api';
import { AaDoraChart } from '../AaDoraChart';

export const AaStockPage = ({ timeperiod }: { timeperiod: Timeperiod }) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  const stockState = useAsync(async (): Promise<any> => {
    const response = await api.getStockData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end,
    });
    return response;
  }, [timeperiod]);

  const riskChartState = useAsync(async (): Promise<any> => {
    const response = await api.getRiskChartData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end,
    });
    return response;
  }, [timeperiod]);

  const createChartSeriesFromData = () => {
    const getLabels = (buckets: any) => {
      if (!buckets) {
        return [];
      }
      const labels: number[] = [];

      const timestamps = Object.keys(buckets);
      if (!timestamps.length) {
        return [];
      }
      timestamps.forEach(item => {
        const start_date = moment(item).unix();
        labels.push(start_date);
      });

      return labels;
    };

    const series = stockState?.value
      ? Object.keys(stockState?.value)
          .filter(item => item !== 'buckets')
          .reduce((acc: { name: string; data: number[][] }[], item) => {
            const formatted = {
              name: item,
              data: getLabels(stockState.value?.buckets).map((date, i) => [
                date * 1000,
                stockState.value[item][i]?.avg_branch_total_modified_lines,
              ]),
              type: 'column',
            };
            return [...acc, formatted];
          }, [])
      : [];

    return series;
  };

  const createRiskChartSeriesFromData = () => {
    if (!riskChartState?.value) {
      return [];
    }
    const series = [
      {
        name: '',
        data: Object.entries(riskChartState?.value).map(entry => {
          return [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]];
        }),
        type: 'pie',
      },
    ];
    return series;
  };

  const chartOptions = [
    {
      series: createChartSeriesFromData(),
    },
  ];

  const riskChartOptions = [
    {
      series: createRiskChartSeriesFromData(),
    },
  ];

  if (stockState?.loading) {
    return <Progress />;
  } else if (stockState?.error) {
    return <Alert severity="error">{stockState?.error.message}</Alert>;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={8}>
        <InfoCard title="Stock">
          <AaDoraChart
            timeperiod={timeperiod}
            charts={chartOptions}
            chartColor={[
              '#15a2bb',
              '#54afc4',
              '#79bccd',
              '#99c9d6',
              '#b7d6df',
              '#d4e3e8',
              '#f1f1f1',
              '#f7dbde',
              '#fcc5cb',
              '#ffaeb9',
              '#ff97a7',
              '#ff7e95',
              '#ff6384',
            ]}
            // chartHeight={360}
            loading={stockState.loading}
            customPointFormatter={null}
            customOptions={null}
            yAxisFormatter={null}
            yAxisTitle="Average number of modified lines"
            customOpacity={1}
          />
        </InfoCard>
      </Grid>
      <Grid item xs={12} lg={4}>
        <InfoCard
          title="Risk Chart"
          deepLink={{
            title: 'Go to Agile Analytics to see a detailed report  ',
            link: 'https://www.prod.agileanalytics.cloud/stock',
          }}
        >
          {riskChartState.error ? (
            <Alert severity="error">{riskChartState?.error.message}</Alert>
          ) : null}
          <AaDoraChart
            timeperiod={timeperiod}
            charts={riskChartOptions}
            chartColor={['#92CE52', '#F8C238', '#E11E1E']}
            loading={riskChartState.loading}
            customPointFormatter={function (this: any) {
              return `<span>Branches amount: <b>${this.options.y}</b></span>`;
            }}
            customOptions={null}
            yAxisFormatter={null}
            customOpacity={1}
          />
        </InfoCard>
      </Grid>
    </Grid>
  );
};
