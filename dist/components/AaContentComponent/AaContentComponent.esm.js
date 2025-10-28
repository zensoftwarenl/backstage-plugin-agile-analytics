import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Grid, Tab } from '@material-ui/core';
import TabPanel from '@mui/lab/TabPanel';
import TabList from '@mui/lab/TabList';
import TabContext from '@mui/lab/TabContext';
import { Content, InfoCard, StructuredMetadataTable } from '@backstage/core-components';
import { AaTimeSelect } from '../AaTimeSelect/AaTimeSelect.esm.js';
import { getEndDate, getStartDate } from '../../helpers.esm.js';
import { AaSprintInsightsPage } from '../AaSprintInsightsPage/AaSprintInsightsPage.esm.js';
import { AaDoraPage } from '../AaDoraPage/AaDoraPage.esm.js';
import { AaStockPage } from '../AaStockPage/AaStockPage.esm.js';
import { AaLeaksPage } from '../AaLeaksPage/AaLeaksPage.esm.js';
import { AaSlosPage } from '../AaSlosPage/AaSlosPage.esm.js';
import { AaErrorBudgetsPage } from '../AaErrorBudgetsPage/AaErrorBudgetsPage.esm.js';
import { AaKudosPage } from '../AaKudosPage/AaKudosPage.esm.js';

const AaContentComponent = ({
  orgData
}) => {
  const [timeperiod, setTimeperiod] = useState({
    date_start: getStartDate(6, "days"),
    date_end: getEndDate(),
    label: "Last 7 days",
    value: "7days"
  });
  const overviewMetadata = {
    "Organisation hash": orgData.orgHash,
    "Organisation name": orgData.orgName,
    "Number of users": orgData.usersNumber,
    Status: orgData.status,
    Subscription: orgData.subscription
  };
  const cardContentStyle = { heightX: 200, width: 600 };
  const tabs = [
    {
      label: "OVERVIEW",
      content: /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, direction: "column", style: cardContentStyle, children: /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(InfoCard, { title: "Organisation's Details", children: /* @__PURE__ */ jsx(StructuredMetadataTable, { metadata: overviewMetadata }) }) }) })
    },
    {
      label: "SPRINT INSIGHTS",
      content: /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, direction: "column", children: /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(AaSprintInsightsPage, { timeperiod }) }) })
    },
    {
      label: "SLOS",
      content: /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, direction: "column", children: /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(AaSlosPage, { timeperiod }) }) })
    },
    {
      label: "ERROR BUDGETS",
      content: /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, direction: "column", children: /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(AaErrorBudgetsPage, { timeperiod }) }) })
    },
    {
      label: "DORA",
      content: /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, direction: "column", children: /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(AaDoraPage, { timeperiod }) }) })
    },
    {
      label: "KUDOS",
      content: /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, direction: "column", children: /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(AaKudosPage, { timeperiod }) }) })
    },
    {
      label: "STOCK",
      content: /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, direction: "column", children: /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(AaStockPage, { timeperiod }) }) })
    },
    {
      label: "LEAKS",
      content: /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, direction: "column", children: /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(AaLeaksPage, { timeperiod }) }) })
    }
  ];
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.label);
  return /* @__PURE__ */ jsx(Content, { className: "content-container", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 3, direction: "column", children: [
    /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(
      AaTimeSelect,
      {
        timeperiod,
        setTimeperiod
      }
    ) }) }),
    /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsxs(TabContext, { value: selectedTab, children: [
      /* @__PURE__ */ jsx(
        TabList,
        {
          onChange: (e, newValue) => setSelectedTab(newValue),
          "aria-label": "Agile Analytics features Tabs",
          children: tabs?.map((tab) => /* @__PURE__ */ jsx(Tab, { label: tab?.label, value: tab?.label }))
        }
      ),
      tabs?.map((tab) => /* @__PURE__ */ jsx(TabPanel, { value: tab?.label, sx: { padding: 0 }, children: tab?.content }))
    ] }) })
  ] }) }) });
};

export { AaContentComponent };
//# sourceMappingURL=AaContentComponent.esm.js.map
