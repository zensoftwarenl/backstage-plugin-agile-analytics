import { jsxs, jsx } from 'react/jsx-runtime';
import { Page, Header, HeaderLabel, Progress } from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import { AaContentComponent } from '../AaContentComponent/AaContentComponent.esm.js';

const AaMainPageComponent = () => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const organisationState = useAsync(async () => {
    const response = await api.getOrganisationData({
      orgHash: orgHash ? orgHash : "",
      apiKey: apiKey ? apiKey : ""
    });
    return response;
  }, []);
  return /* @__PURE__ */ jsxs(Page, { themeId: "tool", children: [
    /* @__PURE__ */ jsxs(
      Header,
      {
        title: organisationState?.value?.orgName ? organisationState.value.orgName.trim() : "Agile Analytics",
        subtitle: `${organisationState?.value?.orgName ? organisationState.value.orgName.trim() : "Your company"}'s essential metrics from Agile Analytics`,
        children: [
          /* @__PURE__ */ jsx(HeaderLabel, { label: "Owner", value: "Zen Software" }),
          /* @__PURE__ */ jsx(HeaderLabel, { label: "Lifecycle", value: "Alpha" })
        ]
      }
    ),
    organisationState?.loading ? /* @__PURE__ */ jsx(Progress, {}) : null,
    organisationState?.error ? /* @__PURE__ */ jsx(Alert, { severity: "error", children: organisationState?.error.message }) : null,
    !organisationState.loading && !organisationState.error ? /* @__PURE__ */ jsx(AaContentComponent, { orgData: organisationState?.value }) : null
  ] });
};

export { AaMainPageComponent };
//# sourceMappingURL=AaMainPageComponent.esm.js.map
