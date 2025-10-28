import { jsxs, jsx } from 'react/jsx-runtime';
import React, { useState } from 'react';
import { LinearGauge } from '@backstage/core-components';
import { Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, IconButton, Collapse } from '@material-ui/core';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import { getUniqueTasks } from '../../helpers.esm.js';

const AaSprintInsightsTable = ({
  timeperiod,
  tickets
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  console.log(tickets);
  const latestTasksWithUniqueParent = getUniqueTasks(tickets).sort(
    (a, b) => b.timestamp - a.timestamp
  );
  const parentTaskWithSubTasks = [];
  latestTasksWithUniqueParent?.forEach((uniqueTask) => {
    const parentTaskWithLatestTimestamp = { ...uniqueTask, isParent: true };
    if (uniqueTask?.subtasks?.length) {
      const parentHours = uniqueTask?.reported_hours ? uniqueTask?.reported_hours : 0;
      const combinedHours = uniqueTask?.subtasks?.reduce((acc, subtask) => {
        if (subtask?.reported_hours) {
          return acc + subtask?.reported_hours;
        }
        return acc;
      }, parentHours);
      parentTaskWithSubTasks.push({
        ...parentTaskWithLatestTimestamp,
        reported_hours: combinedHours
      });
      parentTaskWithSubTasks.push(...uniqueTask?.subtasks);
    } else {
      parentTaskWithSubTasks.push(parentTaskWithLatestTimestamp);
    }
  });
  const formattedTableData = parentTaskWithSubTasks.map((ticket) => {
    const formattedTicket = {
      "date event": ticket.timestamp,
      "transition from": ticket.transition_from,
      "transition to": ticket.transition_to,
      sprint: ticket.sprint ?? "",
      "ticket key": ticket.key,
      type: ticket.type,
      summary: ticket.summary,
      hours: ticket.hours,
      label: ticket?.label?.split(" ").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ") ?? "",
      confidence: ticket?.predictions?.length ? +ticket?.predictions[0].value : null,
      subtasks: ticket?.subtasks?.length ? ticket.subtasks.map((subtask) => {
        return {
          "date event": subtask.timestamp,
          "transition from": subtask.transition_from,
          "transition to": subtask.transition_to,
          sprint: subtask.sprint ?? "",
          "ticket key": subtask.key,
          type: subtask.type,
          summary: subtask.summary,
          hours: subtask.hours,
          label: "",
          confidence: subtask?.predictions?.length ? +subtask?.predictions[0].value : null
        };
      }) : null
    };
    return formattedTicket;
  });
  return /* @__PURE__ */ jsxs(Grid, { item: true, xs: 12, children: [
    /* @__PURE__ */ jsx(TableContainer, { children: /* @__PURE__ */ jsxs(Table, { "aria-label": "collapsible table", children: [
      /* @__PURE__ */ jsx(TableHead, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { padding: "normal" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "none", children: "Date Event" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "normal", children: "From" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "none", children: "To" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "normal", children: "Sprint" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "none", children: "Ticket key" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "normal", children: "Type" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "none", size: "medium", children: "Description" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "normal", children: "Hours" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "none", children: "Label" }),
        /* @__PURE__ */ jsx(TableCell, { padding: "normal", children: "Confidence" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: formattedTableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, i) => /* @__PURE__ */ jsx(Row, { row }, row["date event"])) })
    ] }) }),
    /* @__PURE__ */ jsx(
      TablePagination,
      {
        rowsPerPageOptions: [10, 25, 100],
        component: "div",
        count: formattedTableData.length,
        rowsPerPage,
        page,
        onPageChange: handleChangePage,
        onRowsPerPageChange: handleChangeRowsPerPage
      }
    )
  ] });
};
function Row(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);
  return /* @__PURE__ */ jsxs(React.Fragment, { children: [
    /* @__PURE__ */ jsxs(TableRow, { children: [
      /* @__PURE__ */ jsx(TableCell, { style: { width: "3%", paddingTop: 4, paddingBottom: 4 }, children: row?.subtasks?.length ? /* @__PURE__ */ jsx(
        IconButton,
        {
          onClick: () => setOpen(!open),
          children: open ? /* @__PURE__ */ jsx(KeyboardArrowUp, {}) : /* @__PURE__ */ jsx(KeyboardArrowDown, {})
        }
      ) : null }),
      /* @__PURE__ */ jsx(
        TableCell,
        {
          padding: "none",
          component: "th",
          scope: "row",
          style: { width: "10%", paddingTop: 4, paddingBottom: 4 },
          children: row["date event"]
        }
      ),
      /* @__PURE__ */ jsx(TableCell, { style: { width: "7%", paddingTop: 4, paddingBottom: 4 }, children: row["transition from"] }),
      /* @__PURE__ */ jsx(
        TableCell,
        {
          style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
          padding: "none",
          children: row["transition to"]
        }
      ),
      /* @__PURE__ */ jsx(TableCell, { style: { width: "8%", paddingTop: 4, paddingBottom: 4 }, children: row.sprint }),
      /* @__PURE__ */ jsx(
        TableCell,
        {
          style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
          padding: "none",
          children: row["ticket key"]
        }
      ),
      /* @__PURE__ */ jsx(TableCell, { style: { width: "7%", paddingTop: 4, paddingBottom: 4 }, children: row.type }),
      /* @__PURE__ */ jsx(
        TableCell,
        {
          style: { width: "30%", paddingTop: 4, paddingBottom: 4 },
          padding: "none",
          size: "medium",
          children: row.summary
        }
      ),
      /* @__PURE__ */ jsx(TableCell, { style: { width: "5%", paddingTop: 4, paddingBottom: 4 }, children: row.hours }),
      /* @__PURE__ */ jsx(
        TableCell,
        {
          style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
          padding: "none",
          children: row?.label
        }
      ),
      /* @__PURE__ */ jsx(TableCell, { style: { width: "9%", paddingTop: 4, paddingBottom: 4 }, children: row?.confidence ? /* @__PURE__ */ jsx(LinearGauge, { value: row?.confidence }) : null })
    ] }),
    /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(
      TableCell,
      {
        style: {
          paddingBottom: 0,
          paddingTop: 0,
          paddingLeft: 0,
          paddingRight: 0
        },
        colSpan: 12,
        children: /* @__PURE__ */ jsx(Collapse, { in: open, timeout: "auto", unmountOnExit: true, children: /* @__PURE__ */ jsx(Table, { children: /* @__PURE__ */ jsx(TableBody, { children: row?.subtasks?.map((subtask) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "3%", paddingTop: 4, paddingBottom: 4 },
              children: /* @__PURE__ */ jsx("div", { style: { width: 48, opacity: 0 }, children: " test" })
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "10%", paddingTop: 4, paddingBottom: 4 },
              padding: "none",
              component: "th",
              scope: "row",
              children: subtask["date event"]
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
              children: subtask["transition from"]
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
              padding: "none",
              children: subtask["transition to"]
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "8%", paddingTop: 4, paddingBottom: 4 },
              children: subtask.sprint
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
              padding: "none",
              children: subtask["ticket key"]
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
              children: subtask.type
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "30%", paddingTop: 4, paddingBottom: 4 },
              padding: "none",
              size: "medium",
              children: subtask.summary
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "5%", paddingTop: 4, paddingBottom: 4 },
              children: subtask.hours
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "7%", paddingTop: 4, paddingBottom: 4 },
              padding: "none",
              children: row.label
            }
          ),
          /* @__PURE__ */ jsx(
            TableCell,
            {
              style: { width: "9%", paddingTop: 4, paddingBottom: 4 },
              children: /* @__PURE__ */ jsx(LinearGauge, { value: subtask.confidence })
            }
          )
        ] }, subtask["ticket key"])) }) }) })
      }
    ) })
  ] });
}

export { AaSprintInsightsTable };
//# sourceMappingURL=AaSprintInsightsTable.esm.js.map
