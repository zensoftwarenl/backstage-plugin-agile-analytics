import { jsx } from 'react/jsx-runtime';
import { Progress, InfoCard } from '@backstage/core-components';
import { Typography } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { AaErrorBudgetsChart } from '../AaErrorBudgetsChart/AaErrorBudgetsChart.esm.js';

const AaErrorBudgetsServiceItem = ({
  timeperiod,
  service,
  deploymentsList,
  orgHash,
  apiKey
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const { date_start: dateTimeStart, date_end: dateTimeEnd } = timeperiod;
  const singleServicesState = useAsync(async () => {
    const response = await api.getSingleServiceData({
      orgHash,
      apiKey,
      serviceName: service.service
    });
    return response;
  }, [service]);
  const chartDataState = useAsync(async () => {
    let response = {
      data: null,
      status: 204,
      error: ""
    };
    if (singleServicesState?.value?.features?.length) {
      try {
        const values = await Promise.allSettled(
          singleServicesState?.value?.features.map(
            (featureItem) => api.getErrorBudgetChartData({
              orgHash,
              apiKey,
              serviceName: service.service,
              feature: featureItem.feature_name,
              date_start: dateTimeStart,
              date_end: dateTimeEnd,
              step_size: "24 hours"
            })
          )
        );
        if (values.length) {
          if (!values.find((value) => value.status === "fulfilled")) {
            response = {
              ...response,
              status: 404,
              error: "error"
            };
          } else {
            let status = 200;
            if (!values.find(
              (value) => value.status === "fulfilled" && value.value.status !== 204
            )) {
              status = 204;
            }
            response = {
              ...response,
              data: values.filter((value) => value.status === "fulfilled").map((value) => value.value ? value.value : void 0).filter((value) => value !== void 0),
              status: 200
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
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (singleServicesState?.error || chartDataState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: singleServicesState?.error?.message ?? chartDataState?.error?.message });
  } else if (!singleServicesState?.value || !chartDataState?.value) {
    return /* @__PURE__ */ jsx(Typography, { component: "p", children: "No data" });
  }
  return /* @__PURE__ */ jsx(
    InfoCard,
    {
      title: `Service: ${service?.service}`,
      subheader: `Operational dashboard URL: ${service?.url}`,
      children: !singleServicesState?.value?.features?.length ? /* @__PURE__ */ jsx(Typography, { component: "p", children: "No Error budgets data" }) : /* @__PURE__ */ jsx(
        AaErrorBudgetsChart,
        {
          timeperiod,
          selectedService: service?.service,
          serviceState: singleServicesState?.value,
          step: "24 hours",
          chartState: chartDataState?.value,
          deploymentsList
        }
      )
    }
  );
};

export { AaErrorBudgetsServiceItem };
//# sourceMappingURL=AaErrorBudgetsServiceItem.esm.js.map
