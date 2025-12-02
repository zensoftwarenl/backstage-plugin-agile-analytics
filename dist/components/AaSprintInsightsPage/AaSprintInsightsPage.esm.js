import { jsx, jsxs } from 'react/jsx-runtime';
import { Progress, InfoCard, GaugeCard } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { Grid } from '@material-ui/core';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import { AaSprintInsightsTable } from '../AaSprintInsightsTable/AaSprintInsightsTable.esm.js';

const AaSprintInsightsPage = ({
  timeperiod,
  orgHash,
  apiKey
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const siState = useAsync(async () => {
    const response = await api.getSiData({
      orgHash,
      apiKey,
      dateStart: timeperiod?.date_start,
      dateEnd: timeperiod?.date_end
    });
    return response;
  }, [timeperiod]);
  if (siState?.loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (siState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: siState?.error.message });
  }
  const ticketsTotal = siState.value.featuresAmount + siState.value.notFeaturesAmount;
  const featuresPart = siState.value.featuresAmount / ticketsTotal;
  const notFeaturesPart = siState.value.notFeaturesAmount / ticketsTotal;
  const timeTotal = siState.value.featuresTime + siState.value.notFeaturesTime;
  const featuresTimePart = siState.value.featuresTime / timeTotal;
  const notFeaturesTimePart = siState.value.notFeaturesTime / timeTotal;
  return /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 2, children: [
    /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(
      InfoCard,
      {
        title: "Feature - not feature",
        subheader: "How many features and not-feature tasks are in development",
        children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 2, children: [
          /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(
            GaugeCard,
            {
              title: "Features",
              progress: featuresPart,
              description: `${siState.value.featuresAmount} tickets`
            }
          ) }),
          /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(
            GaugeCard,
            {
              title: "Not features",
              progress: notFeaturesPart,
              description: `${siState.value.notFeaturesAmount} tickets`
            }
          ) })
        ] })
      }
    ) }),
    /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(
      InfoCard,
      {
        title: "Time spent",
        subheader: "How much time were spent on features and not-feature tasks",
        children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 2, children: [
          /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(
            GaugeCard,
            {
              title: "Features",
              progress: featuresTimePart,
              description: `${siState.value.featuresTime} hours spent`
            }
          ) }),
          /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(
            GaugeCard,
            {
              title: "Not features",
              progress: notFeaturesTimePart,
              description: `${siState.value.notFeaturesTime} hours spent`
            }
          ) })
        ] })
      }
    ) }),
    /* @__PURE__ */ jsx(
      AaSprintInsightsTable,
      {
        timeperiod,
        tickets: siState.value.tickets
      }
    )
  ] });
};

export { AaSprintInsightsPage };
//# sourceMappingURL=AaSprintInsightsPage.esm.js.map
