import { jsx } from 'react/jsx-runtime';
import moment from 'moment';
import { Progress, InfoCard } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { Grid } from '@material-ui/core';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import { AaDoraChart } from '../AaDoraChart/AaDoraChart.esm.js';

const AaLeaksPage = ({
  timeperiod,
  orgHash,
  apiKey
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const leaksState = useAsync(async () => {
    const response = await api.getLeaksData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end
    });
    return response;
  }, [timeperiod]);
  const chartOptions = [
    {
      series: [
        {
          name: "All leakes",
          data: leaksState?.value?.statistics?.length ? leaksState.value.statistics.map((item) => {
            return [moment(item.date).unix() * 1e3, item.leaks_quantity];
          }) : []
        },
        {
          name: "Solved",
          data: leaksState?.value?.statistics?.length ? leaksState.value.statistics.map((item) => {
            return [moment(item.date).unix() * 1e3, item.leaks_fixed];
          }) : []
        }
      ]
    }
  ];
  if (leaksState?.loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (leaksState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: leaksState?.error.message });
  }
  return /* @__PURE__ */ jsx(Grid, { container: true, spacing: 2, children: /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(
    InfoCard,
    {
      title: "Leaks",
      deepLink: {
        title: "Go to Agile Analytics to see a detailed report  ",
        link: "https://www.prod.agileanalytics.cloud/leaks"
      },
      children: /* @__PURE__ */ jsx(
        AaDoraChart,
        {
          timeperiod,
          charts: chartOptions,
          chartColor: ["#FF6384", "#15A2BB"],
          loading: leaksState.loading,
          customPointFormatter: null,
          customOptions: null,
          yAxisFormatter: null,
          yAxisTitle: "Leaks amount",
          customOpacity: 1,
          isMarker: false,
          isStacking: false
        }
      )
    }
  ) }) });
};

export { AaLeaksPage };
//# sourceMappingURL=AaLeaksPage.esm.js.map
