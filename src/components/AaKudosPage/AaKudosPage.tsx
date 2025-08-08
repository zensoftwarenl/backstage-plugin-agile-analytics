/* eslint-disable no-console */
import React, { useState, useEffect } from 'react';
import { Progress } from '@backstage/core-components';
import {
  EmojiDataResponse,
  TeamKudosLeaderBoardResponse,
  TeamsDataResponse,
  Timeperiod,
  User,
  WorkspacesDataResponse,
} from '../../api/types';
import { Grid, Typography } from '@material-ui/core';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { agileAnalyticsApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { AaKudosLast } from '../AaKudosLast';
import { AaKudosTotal } from '../AaKudosTotal';
import { AaKudosLeaderboard } from '../AaKudosLeaderboard';
import { AaKudosChart } from '../AaKudosChart';

export const AaKudosPage = ({ timeperiod }: { timeperiod: Timeperiod }) => {
  const api = useApi(agileAnalyticsApiRef);
  const config = useApi(configApiRef);
  const orgHash = config.getString('agileAnalytics.orgHash');
  const apiKey = config.getString('agileAnalytics.apiKey');

  const { date_start, date_end } = timeperiod;

  const teamsDataState = useAsync(async (): Promise<TeamsDataResponse> => {
    const response = await api.getTeamsData({
      orgHash,
      apiKey,
    });
    return response;
  }, []);

  const workspacesState =
    useAsync(async (): Promise<WorkspacesDataResponse> => {
      const response = await api.getWorkspacesData({
        orgHash,
        apiKey,
      });
      return response;
    }, []);

  const emojiState = useAsync(async (): Promise<EmojiDataResponse> => {
    const response = await api.getEmoji({
      orgHash,
      apiKey,
    });
    return response;
  }, [timeperiod]);

  const [activeTeam, setActiveTeam] = useState<string | null>(null);

  const kudosLeaderBoardState =
    useAsync(async (): Promise<TeamKudosLeaderBoardResponse> => {
      const response = await api.getTeamKudosLeaderBoard({
        orgHash,
        apiKey,
        team: activeTeam ? activeTeam : 'all',
        date_end,
        date_start,
      });
      return response;
    }, [activeTeam, timeperiod]);

  const [localTeamsState, setLocalTeamsState] = useState(() => {
    if (teamsDataState?.value) {
      return {
        ...teamsDataState,
        data: [
          ...(teamsDataState?.value || null),
          {
            team_hash: 'all',
            team_name: 'Overall',
            users_in_team: [],
          },
        ],
      };
    }
    return {
      ...teamsDataState,
      data: [
        {
          team_hash: 'all',
          team_name: 'Overall',
          users_in_team: [],
        },
      ],
    };
  });

  const orgUsersState = useAsync(async (): Promise<any> => {
    let response: { data?: any; status: number; error: string } = {
      data: null,
      status: 204,
      error: '',
    };

    const usersList = await api.getOrgUsersData({
      orgHash,
      apiKey,
    });

    if (usersList?.length) {
      try {
        const values: any = await Promise.allSettled(
          usersList.map((user: User) => {
            if (user?.photo && !user?.photo?.startsWith('https://')) {
              const userPic = api.getUserPic({
                orgHash,
                apiKey,
                url: user?.photo,
              });
              return userPic;
            }

            return user?.photo;
          }),
        );

        const usersListWithUserPics = usersList?.map((user, i: number) => {
          return { ...user, photo: values[i]?.value };
        });

        response = { data: usersListWithUserPics, status: 200, error: '' };
      } catch (err) {
        console.log(err);
      }
    }

    return response;
  }, []);

  useEffect(() => {
    if (!teamsDataState?.value) {
      setActiveTeam('all');

      setLocalTeamsState(() => {
        return {
          ...(teamsDataState || null),

          data: [
            {
              team_hash: 'all',
              team_name: 'Overall',
              users_in_team: [],
            },
          ],
        };
      });
    } else {
      setActiveTeam('all');

      setLocalTeamsState(() => {
        return {
          ...(teamsDataState || null),
          data: [
            {
              team_hash: 'all',
              team_name: 'Overall',
              users_in_team: [],
            },
            ...(teamsDataState?.value || []),
          ],
        };
      });
    }
  }, [teamsDataState?.value, workspacesState?.value]);

  if (
    teamsDataState?.loading ||
    workspacesState?.loading ||
    orgUsersState?.loading
  ) {
    return <Progress />;
  } else if (
    teamsDataState?.error ||
    workspacesState?.error ||
    orgUsersState?.error
  ) {
    return (
      <Alert severity="error">
        {teamsDataState?.error?.message
          ? teamsDataState?.error.message
          : workspacesState?.error?.message
          ? workspacesState?.error?.message
          : orgUsersState?.error?.message}
      </Alert>
    );
  } else if (!localTeamsState?.data?.length) {
    return <Typography component="p">No data</Typography>;
  } else if (!workspacesState?.value) {
    return <Typography component="p">Slack is not connected</Typography>;
  } else if (!orgUsersState?.value) {
    return <Typography component="p">No users in the organisation</Typography>;
  }

  return (
    <Grid container spacing={3} alignItems="stretch">
      <Grid item xs={4}>
        <AaKudosLast
          users={orgUsersState?.value}
          kudos={emojiState?.value ? emojiState?.value : []}
          kudosLeaderBoard={kudosLeaderBoardState?.value}
        />
      </Grid>
      <Grid item xs={4}>
        <AaKudosTotal
          users={orgUsersState?.value}
          kudos={emojiState?.value ? emojiState?.value : []}
          kudosLeaderBoard={kudosLeaderBoardState?.value}
        />
      </Grid>
      <Grid item xs={4}>
        <AaKudosLeaderboard
          localTeamsState={
            localTeamsState?.data?.length ? localTeamsState?.data : []
          }
          selectedTeam={activeTeam}
          setActiveTeam={setActiveTeam}
          teamsState={
            teamsDataState?.value?.length ? teamsDataState?.value : []
          }
          users={orgUsersState?.value}
          kudos={emojiState?.value ? emojiState?.value : []}
          kudosLeaderBoard={kudosLeaderBoardState?.value}
          timeperiod={timeperiod}
        />
      </Grid>
      <Grid item xs={12}>
        <AaKudosChart
          timeperiod={timeperiod}
          users={orgUsersState?.value}
          activeTeam={activeTeam ? activeTeam : 'all'}
        />
      </Grid>
    </Grid>
  );
};
