import { jsx, jsxs } from 'react/jsx-runtime';
import { Progress } from '@backstage/core-components';
import { Typography, Card, Box, Divider, Grid } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import CheckCircleOutlineOutlinedIcon from '@material-ui/icons/CheckCircleOutlineRounded';
import HighlightOff from '@material-ui/icons/HighlightOff';
import moment from 'moment';

const AaSloServiceSloCard = ({
  timeperiod,
  service,
  feature,
  orgHash,
  apiKey
}) => {
  const api = useApi(agileAnalyticsApiRef);
  const { date_start, date_end } = timeperiod;
  const chartDataState = useAsync(async () => {
    const response = await api.getErrorBudgetChartData({
      orgHash,
      apiKey,
      serviceName: service.service,
      feature: feature.feature_name,
      date_start,
      date_end,
      step_size: "24 hours"
    });
    return response;
  }, [feature, timeperiod]);
  const sloHistoryState = useAsync(async () => {
    let response = {
      data: null,
      status: 204,
      error: ""
    };
    if (chartDataState?.value) {
      const dates = [];
      while (dates?.length < 4) {
        let week = null;
        let year = null;
        if (!dates?.length) {
          week = moment().isoWeek();
          year = moment().year();
        } else {
          const endMomentObj = moment(
            (dates[dates?.length - 1][0] - 1) * 1e3
          );
          week = endMomentObj.isoWeek();
          year = endMomentObj.year();
        }
        const weekStart = moment().year(year).week(week).startOf("week").unix();
        const weekEnd = moment().year(year).week(week).endOf("week").unix();
        dates.push([weekStart, weekEnd]);
      }
      try {
        const values = await Promise.allSettled(
          dates.map(
            (date) => api.getErrorBudgetChartData({
              orgHash,
              apiKey,
              serviceName: service.service,
              feature: feature.feature_name,
              date_start: date[0],
              date_end: date[1],
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
            const filteredValues = values.filter((value) => value.status === "fulfilled").map((value) => value.value.data ? value.value.data : void 0).filter((value) => value !== void 0);
            const calculatedSloData = filteredValues.map((item) => {
              return calculateAverageSloValue(
                item,
                chartDataState?.value?.slo_target
              );
            });
            response = {
              ...response,
              data: {
                slo: calculatedSloData,
                dates
              },
              status
            };
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
    return response;
  }, [chartDataState?.value]);
  const filteredData = filterData(chartDataState?.value?.data);
  function filterData(dataArray) {
    if (!dataArray?.length) {
      return null;
    }
    return dataArray?.map((item) => item[1]);
  }
  function calculateSloValue(filtered, target) {
    if (!filtered?.length || !target) {
      return 0;
    }
    const latestMeasurement = filtered[filtered.length - 1];
    const totalErrorBudget = 1 - target;
    const avaivableErrorBudget = totalErrorBudget * latestMeasurement / 100;
    const slo = (target + avaivableErrorBudget) * 100;
    return slo.toFixed(3);
  }
  function calculateAverageSloValue(dataPoints, target) {
    const slosForEachPoint = dataPoints.map((dataPoint) => {
      const slo = calculateSloValue([dataPoint[1]], target);
      return +slo;
    });
    const averageSlo = slosForEachPoint?.reduce((acc, item) => +acc + +item, 0) / slosForEachPoint?.length;
    return averageSlo.toFixed(3);
  }
  if (chartDataState?.loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (chartDataState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: chartDataState?.error.message });
  } else if (!chartDataState?.value) {
    return /* @__PURE__ */ jsx(Typography, { component: "p", children: "No data" });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(Box, { sx: { marginY: "16px", textAlign: "center" }, children: [
      /* @__PURE__ */ jsx(Typography, { variant: "h5", children: chartDataState.value.slo_name }),
      /* @__PURE__ */ jsx(Typography, { variant: "subtitle1", children: "in the last 24 hours" })
    ] }),
    /* @__PURE__ */ jsx(Divider, { "aria-hidden": "true" }),
    /* @__PURE__ */ jsx(
      Box,
      {
        sx: {
          paddingTop: "12px",
          paddingX: "12px"
        },
        children: /* @__PURE__ */ jsx(Typography, { component: "p", variant: "h6", align: "center", children: calculateSloValue(filteredData, chartDataState.value.slo_target) ? `${calculateSloValue(
          filteredData,
          chartDataState?.value?.slo_target
        )}%` : "no SLO DATA" })
      }
    ),
    /* @__PURE__ */ jsxs(
      Box,
      {
        sx: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gridGap: "4px",
          padding: "12px"
        },
        children: [
          +calculateSloValue(filteredData, chartDataState.value.slo_target) > chartDataState.value.slo_target * 100 ? /* @__PURE__ */ jsx(
            CheckCircleOutlineOutlinedIcon,
            {
              style: { color: "#8ec358", fontSize: 24 }
            }
          ) : /* @__PURE__ */ jsx(HighlightOff, { style: { color: "#c03a3a", fontSize: 24 } }),
          /* @__PURE__ */ jsxs(Typography, { component: "p", variant: "subtitle1", align: "center", children: [
            "Target: ",
            chartDataState.value.slo_target * 100,
            "%"
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx(Divider, { "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs(Box, { sx: { padding: "12px" }, children: [
      /* @__PURE__ */ jsx(Typography, { component: "p", variant: "body1", children: "Last 4-week history:" }),
      sloHistoryState?.loading ? /* @__PURE__ */ jsx(Progress, {}) : null,
      !sloHistoryState?.loading && sloHistoryState?.error ? /* @__PURE__ */ jsx(Alert, { severity: "error", children: "Faled to load SLO's history" }) : null,
      !sloHistoryState?.loading && !sloHistoryState?.error && !sloHistoryState?.value?.data?.slo?.length ? /* @__PURE__ */ jsx(Typography, { component: "p", variant: "body1", children: "No data" }) : null,
      !sloHistoryState?.loading && !sloHistoryState?.error && sloHistoryState?.value?.data?.slo?.length ? /* @__PURE__ */ jsx(Grid, { container: true, spacing: 2, children: sloHistoryState?.value?.data?.slo?.map((slo) => /* @__PURE__ */ jsx(Grid, { item: true, xs: 3, children: /* @__PURE__ */ jsx(
        Box,
        {
          sx: {
            padding: "2px",
            bgcolor: `${+slo >= chartDataState.value.slo_target * 100 ? "#8ec358" : "#c03a3a"}`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#fff"
          },
          children: slo
        }
      ) })) }) : null
    ] })
  ] });
};

export { AaSloServiceSloCard };
//# sourceMappingURL=AaSloServiceSloCard.esm.js.map
