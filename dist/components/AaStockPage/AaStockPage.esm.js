import { jsx, jsxs } from 'react/jsx-runtime';
import moment from 'moment';
import { Progress, InfoCard } from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { Grid } from '@material-ui/core';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import { AaDoraChart } from '../AaDoraChart/AaDoraChart.esm.js';

const AaStockPage = ({ timeperiod }) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const stockState = useAsync(async () => {
    const response = await api.getStockData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end
    });
    return response;
  }, [timeperiod]);
  const riskChartState = useAsync(async () => {
    const response = await api.getRiskChartData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end
    });
    return response;
  }, [timeperiod]);
  const createChartSeriesFromData = () => {
    const getLabels = (buckets) => {
      if (!buckets) {
        return [];
      }
      const labels = [];
      const timestamps = Object.keys(buckets);
      if (!timestamps.length) {
        return [];
      }
      timestamps.forEach((item) => {
        const start_date = moment(item).unix();
        labels.push(start_date);
      });
      return labels;
    };
    const series = stockState?.value ? Object.keys(stockState?.value).filter((item) => item !== "buckets").reduce((acc, item) => {
      const formatted = {
        name: item,
        data: getLabels(stockState.value?.buckets).map((date, i) => [
          date * 1e3,
          stockState.value[item][i]?.avg_branch_total_modified_lines
        ]),
        type: "column"
      };
      return [...acc, formatted];
    }, []) : [];
    return series;
  };
  const createRiskChartSeriesFromData = () => {
    if (!riskChartState?.value) {
      return [];
    }
    const series = [
      {
        name: "",
        data: Object.entries(riskChartState?.value).map((entry) => {
          return [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]];
        }),
        type: "pie"
      }
    ];
    return series;
  };
  const chartOptions = [
    {
      series: createChartSeriesFromData()
    }
  ];
  const riskChartOptions = [
    {
      series: createRiskChartSeriesFromData()
    }
  ];
  if (stockState?.loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (stockState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: stockState?.error.message });
  }
  return /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 2, children: [
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, lg: 8, children: /* @__PURE__ */ jsx(InfoCard, { title: "Stock", children: /* @__PURE__ */ jsx(
      AaDoraChart,
      {
        timeperiod,
        charts: chartOptions,
        chartColor: [
          "#15a2bb",
          "#54afc4",
          "#79bccd",
          "#99c9d6",
          "#b7d6df",
          "#d4e3e8",
          "#f1f1f1",
          "#f7dbde",
          "#fcc5cb",
          "#ffaeb9",
          "#ff97a7",
          "#ff7e95",
          "#ff6384"
        ],
        loading: stockState.loading,
        customPointFormatter: null,
        customOptions: null,
        yAxisFormatter: null,
        yAxisTitle: "Average number of modified lines",
        customOpacity: 1
      }
    ) }) }),
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, lg: 4, children: /* @__PURE__ */ jsxs(
      InfoCard,
      {
        title: "Risk Chart",
        deepLink: {
          title: "Go to Agile Analytics to see a detailed report  ",
          link: "https://www.prod.agileanalytics.cloud/stock"
        },
        children: [
          riskChartState.error ? /* @__PURE__ */ jsx(Alert, { severity: "error", children: riskChartState?.error.message }) : null,
          /* @__PURE__ */ jsx(
            AaDoraChart,
            {
              timeperiod,
              charts: riskChartOptions,
              chartColor: ["#92CE52", "#F8C238", "#E11E1E"],
              loading: riskChartState.loading,
              customPointFormatter: function() {
                return `<span>Branches amount: <b>${this.options.y}</b></span>`;
              },
              customOptions: null,
              yAxisFormatter: null,
              customOpacity: 1
            }
          )
        ]
      }
    ) })
  ] });
};

export { AaStockPage };
//# sourceMappingURL=AaStockPage.esm.js.map
