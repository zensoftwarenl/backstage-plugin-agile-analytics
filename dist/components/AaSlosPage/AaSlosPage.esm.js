import { jsx } from 'react/jsx-runtime';
import { Progress } from '@backstage/core-components';
import { Typography, Box } from '@material-ui/core';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import useAsync from 'react-use/lib/useAsync';
import { AaSloServiceItem } from '../AaSloServiceItem/AaSloServiceItem.esm.js';
import Alert from '@material-ui/lab/Alert';

const AaSlosPage = ({ timeperiod }) => {
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
  if (servicesState?.loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (servicesState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: servicesState?.error.message });
  } else if (!servicesState?.value?.length) {
    return /* @__PURE__ */ jsx(Typography, { component: "p", children: "No services find" });
  }
  return /* @__PURE__ */ jsx(Box, { sx: { display: "flex", flexDirection: "column" }, children: servicesState?.value?.map((item) => /* @__PURE__ */ jsx(Box, { sx: { marginBottom: "24px" }, children: /* @__PURE__ */ jsx(AaSloServiceItem, { timeperiod, service: item }) })) });
};

export { AaSlosPage };
//# sourceMappingURL=AaSlosPage.esm.js.map
