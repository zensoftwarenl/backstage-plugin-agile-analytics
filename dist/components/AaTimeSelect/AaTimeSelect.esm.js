import { jsx } from 'react/jsx-runtime';
import { Select } from '@backstage/core-components';
import { getEndDate, getStartDate } from '../../helpers.esm.js';
import { Box } from '@material-ui/core';

const AaTimeSelect = ({
  timeperiod,
  setTimeperiod
}) => {
  const timeSelect = [
    {
      date_start: getStartDate(6, "days"),
      date_end: getEndDate(),
      label: "Last 7 days",
      value: "7days"
    },
    {
      date_start: getStartDate(13, "days"),
      date_end: getEndDate(),
      label: "Last 14 days",
      value: "14days"
    },
    {
      date_start: getStartDate(2, "months"),
      date_end: getEndDate(),
      label: "Last 2 months",
      value: "2months"
    },
    {
      date_start: getStartDate(3, "months"),
      date_end: getEndDate(),
      label: "Last 3 months",
      value: "3months"
    }
  ];
  function handleTimeperiodChange(value) {
    const updatedTimeperiod = timeSelect.find((period) => period.value === value);
    if (updatedTimeperiod) {
      setTimeperiod(updatedTimeperiod);
    }
  }
  return /* @__PURE__ */ jsx(Box, { sx: { display: "flex" }, children: /* @__PURE__ */ jsx(Box, { sx: { minWidth: "260px", marginRight: "24px" }, children: /* @__PURE__ */ jsx(
    Select,
    {
      label: "Timeperiod",
      items: timeSelect,
      selected: "7days",
      onChange: (e) => handleTimeperiodChange(e.toString())
    }
  ) }) });
};

export { AaTimeSelect };
//# sourceMappingURL=AaTimeSelect.esm.js.map
