import { jsx } from 'react/jsx-runtime';
import { Progress } from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { Typography, Box } from '@material-ui/core';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import { AaErrorBudgetsServiceItem } from '../AaErrorBudgetsServiceItem/AaErrorBudgetsServiceItem.esm.js';

const AaErrorBudgetsPage = ({
  timeperiod
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const servicesState = useAsync(async () => {
    const response = await api.getServicesData({
      orgHash,
      apiKey
    });
    return response;
  }, []);
  const deploymentFreqState = useAsync(async () => {
    const response = await api.getDeploymentFreqData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end
    });
    return response;
  }, [timeperiod]);
  if (servicesState?.loading || deploymentFreqState?.loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (servicesState?.error || deploymentFreqState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: servicesState?.error?.message ? servicesState?.error.message : deploymentFreqState?.error?.message });
  } else if (!servicesState?.value?.length) {
    return /* @__PURE__ */ jsx(Typography, { component: "p", children: "No services find" });
  }
  return /* @__PURE__ */ jsx(Box, { sx: { display: "flex", flexDirection: "column" }, children: servicesState?.value?.map((item) => /* @__PURE__ */ jsx(Box, { sx: { marginBottom: "24px" }, children: /* @__PURE__ */ jsx(AaErrorBudgetsServiceItem, { timeperiod, service: item, deploymentsList: deploymentFreqState?.value }) })) });
};

export { AaErrorBudgetsPage };
//# sourceMappingURL=AaErrorBudgetsPage.esm.js.map
