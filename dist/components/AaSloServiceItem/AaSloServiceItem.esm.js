import { jsx } from 'react/jsx-runtime';
import { Progress, InfoCard } from '@backstage/core-components';
import { Typography, Grid } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { AaSloServiceSloCard } from '../AaSloServiceSloCard/AaSloServiceSloCard.esm.js';

const AaSloServiceItem = ({
  timeperiod,
  service,
  orgHash,
  apiKey
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const singleServicesState = useAsync(async () => {
    const response = await api.getSingleServiceData({
      orgHash,
      apiKey,
      serviceName: service.service
    });
    return response;
  }, [service]);
  if (singleServicesState?.loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (singleServicesState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: singleServicesState?.error.message });
  } else if (!singleServicesState?.value) {
    return /* @__PURE__ */ jsx(Typography, { component: "p", children: "No data" });
  }
  return /* @__PURE__ */ jsx(
    InfoCard,
    {
      title: `Service: ${service?.service}`,
      subheader: `Operational dashboard URL: ${service?.url}`,
      children: !singleServicesState?.value?.features?.length ? /* @__PURE__ */ jsx(Typography, { component: "p", children: "No SLOs" }) : /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, alignItems: "stretch", children: singleServicesState.value.features.map((feature) => /* @__PURE__ */ jsx(Grid, { item: true, xs: 3, children: /* @__PURE__ */ jsx(
        AaSloServiceSloCard,
        {
          timeperiod,
          service,
          feature,
          orgHash,
          apiKey
        }
      ) })) })
    }
  );
};

export { AaSloServiceItem };
//# sourceMappingURL=AaSloServiceItem.esm.js.map
