import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { Progress } from '@backstage/core-components';
import { Typography, Grid } from '@material-ui/core';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api/index.esm.js';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { AaKudosLast } from '../AaKudosLast/AaKudosLast.esm.js';
import { AaKudosTotal } from '../AaKudosTotal/AaKudosTotal.esm.js';
import { AaKudosLeaderboard } from '../AaKudosLeaderboard/AaKudosLeaderboard.esm.js';
import { AaKudosChart } from '../AaKudosChart/AaKudosChart.esm.js';

const AaKudosPage = ({ timeperiod }) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString("agileAnalytics.orgHash");
  const apiKey = config.getString("agileAnalytics.apiKey");
  const { date_start, date_end } = timeperiod;
  const teamsDataState = useAsync(async () => {
    const response = await api.getTeamsData({
      orgHash,
      apiKey
    });
    return response;
  }, []);
  const workspacesState = useAsync(async () => {
    const response = await api.getWorkspacesData({
      orgHash,
      apiKey
    });
    return response;
  }, []);
  const emojiState = useAsync(async () => {
    const response = await api.getEmoji({
      orgHash,
      apiKey
    });
    return response;
  }, [timeperiod]);
  const [activeTeam, setActiveTeam] = useState(null);
  const kudosLeaderBoardState = useAsync(async () => {
    const response = await api.getTeamKudosLeaderBoard({
      orgHash,
      apiKey,
      team: activeTeam ? activeTeam : "all",
      date_end,
      date_start
    });
    return response;
  }, [activeTeam, timeperiod]);
  const [localTeamsState, setLocalTeamsState] = useState(() => {
    if (teamsDataState?.value) {
      return {
        ...teamsDataState,
        data: [
          ...teamsDataState?.value || null,
          {
            team_hash: "all",
            team_name: "Overall",
            users_in_team: []
          }
        ]
      };
    }
    return {
      ...teamsDataState,
      data: [
        {
          team_hash: "all",
          team_name: "Overall",
          users_in_team: []
        }
      ]
    };
  });
  const orgUsersState = useAsync(async () => {
    let response = {
      data: null,
      status: 204,
      error: ""
    };
    const usersList = await api.getOrgUsersData({
      orgHash,
      apiKey
    });
    if (usersList?.length) {
      try {
        const values = await Promise.allSettled(
          usersList.map((user) => {
            if (user?.photo && !user?.photo?.startsWith("https://")) {
              const userPic = api.getUserPic({
                orgHash,
                apiKey,
                url: user?.photo
              });
              return userPic;
            }
            return user?.photo;
          })
        );
        const usersListWithUserPics = usersList?.map((user, i) => {
          return { ...user, photo: values[i]?.value };
        });
        response = { data: usersListWithUserPics, status: 200, error: "" };
      } catch (err) {
        console.log(err);
      }
    }
    return response;
  }, []);
  useEffect(() => {
    if (!teamsDataState?.value) {
      setActiveTeam("all");
      setLocalTeamsState(() => {
        return {
          ...teamsDataState || null,
          data: [
            {
              team_hash: "all",
              team_name: "Overall",
              users_in_team: []
            }
          ]
        };
      });
    } else {
      setActiveTeam("all");
      setLocalTeamsState(() => {
        return {
          ...teamsDataState || null,
          data: [
            {
              team_hash: "all",
              team_name: "Overall",
              users_in_team: []
            },
            ...teamsDataState?.value || []
          ]
        };
      });
    }
  }, [teamsDataState?.value, workspacesState?.value]);
  if (teamsDataState?.loading || workspacesState?.loading || orgUsersState?.loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (teamsDataState?.error || workspacesState?.error || orgUsersState?.error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: teamsDataState?.error?.message ? teamsDataState?.error.message : workspacesState?.error?.message ? workspacesState?.error?.message : orgUsersState?.error?.message });
  } else if (!localTeamsState?.data?.length) {
    return /* @__PURE__ */ jsx(Typography, { component: "p", children: "No data" });
  } else if (!workspacesState?.value) {
    return /* @__PURE__ */ jsx(Typography, { component: "p", children: "Slack is not connected" });
  } else if (!orgUsersState?.value) {
    return /* @__PURE__ */ jsx(Typography, { component: "p", children: "No users in the organisation" });
  }
  return /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 3, alignItems: "stretch", children: [
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 4, children: /* @__PURE__ */ jsx(
      AaKudosLast,
      {
        users: orgUsersState?.value,
        kudos: emojiState?.value ? emojiState?.value : [],
        kudosLeaderBoard: kudosLeaderBoardState?.value
      }
    ) }),
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 4, children: /* @__PURE__ */ jsx(
      AaKudosTotal,
      {
        users: orgUsersState?.value,
        kudos: emojiState?.value ? emojiState?.value : [],
        kudosLeaderBoard: kudosLeaderBoardState?.value
      }
    ) }),
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 4, children: /* @__PURE__ */ jsx(
      AaKudosLeaderboard,
      {
        localTeamsState: localTeamsState?.data?.length ? localTeamsState?.data : [],
        selectedTeam: activeTeam,
        setActiveTeam,
        teamsState: teamsDataState?.value?.length ? teamsDataState?.value : [],
        users: orgUsersState?.value,
        kudos: emojiState?.value ? emojiState?.value : [],
        kudosLeaderBoard: kudosLeaderBoardState?.value,
        timeperiod
      }
    ) }),
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(
      AaKudosChart,
      {
        timeperiod,
        users: orgUsersState?.value,
        activeTeam: activeTeam ? activeTeam : "all"
      }
    ) })
  ] });
};

export { AaKudosPage };
//# sourceMappingURL=AaKudosPage.esm.js.map
