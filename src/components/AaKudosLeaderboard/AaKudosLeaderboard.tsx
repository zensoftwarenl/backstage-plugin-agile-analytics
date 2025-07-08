/* eslint-disable no-console */
import React, { Fragment } from 'react';
import { InfoCard, Select } from '@backstage/core-components';
import {
  EmojiDataResponse,
  OrgUsersDataResponse,
  Team,
  Timeperiod,
  User,
} from '../../api/types';
import { ListItem, List } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import { init } from 'emoji-mart';
import data from '@emoji-mart/data';

init({ data });


declare global {
  namespace JSX {
    interface IntrinsicElements {
      'em-emoji': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        id?: string;
        shortcode?: string;
        size?: string | number;
        set?: string;
      };
    }
  }
}

export const AaKudosLeaderboard = ({
  localTeamsState,
  selectedTeam,
  setActiveTeam,
  teamsState,
  users,
  kudos,
  kudosLeaderBoard,
  timeperiod,
}: {
  localTeamsState: Team[];
  selectedTeam: string | null;
  setActiveTeam: any;
  teamsState: Team[];
  users: { data: OrgUsersDataResponse };
  kudos: EmojiDataResponse;
  kudosLeaderBoard: any;
  timeperiod: Timeperiod;
}) => {
  const transformTeamList = () => {
    const transformed = localTeamsState.map(team => {
      return {
        value: team.team_hash,
        label: team.team_name,
      };
    });

    return transformed?.length ? transformed : [];
  };

  const getSelectedTeam = () => {
    const selected = transformTeamList().find(
      team => team.value === selectedTeam,
    );
    return selected ? selected : { value: 'all', label: 'Overall' };
  };

  const createList = () => {
    if (selectedTeam === 'all') {
      const teamUsers = users?.data.map((user: User) => user.hash);

      if (teamUsers.length === 0) {
        return (
          <li>
            <p className="font-display text-center text-gray-500 text-xl p-4">
              No users in team
            </p>
          </li>
        );
      }

      const sortedList =
        kudosLeaderBoard.team_members_list.length > 0
          ? [...kudosLeaderBoard.team_members_list]
          : teamUsers.map(userHash => ({
              hash: userHash,
              emoji_quantity: 0,
              rank: 1,
            }));

      return sortedList.map((userData, index) => {
        return (
          <LeaderbordBodyRow
            emoji={kudos}
            key={userData.hash}
            person={users.data.find(user => user.hash === userData.hash)}
            rank={userData.rank}
            emojiQuantity={userData.emoji_quantity}
            usersList={sortedList}
            index={index}
          />
        );
      });
    }

    const currentTeam = localTeamsState.find(
      team => team.team_hash === selectedTeam,
    );

    if (currentTeam) {
      const teamUsers = currentTeam?.users_in_team;

      if (
        teamUsers.length === 0 ||
        (teamUsers.length === 1 && teamUsers[0] === '')
      ) {
        return (
          <li className="flex-grow">
            <p className="font-display text-center text-gray-500 text-xl p-4">
              No users in team
            </p>
          </li>
        );
      }

      const sortedList =
        kudosLeaderBoard.team_members_list.length > 0
          ? [...kudosLeaderBoard.team_members_list]
          : teamUsers.map(userHash => ({
              hash: userHash,
              emoji_quantity: 0,
              rank: 1,
            }));

      return sortedList.map((userData, index) => {
        return (
          <LeaderbordBodyRow
            emoji={kudos}
            key={userData.hash}
            person={users.data.find(user => user.hash === userData.hash)}
            rank={userData.rank}
            usersList={sortedList}
            emojiQuantity={userData.emoji_quantity}
            index={index}
          />
        );
      });
    }
    return null;
  };

  if (localTeamsState.length === 1) {
    return (
      <div className="flex justify-between items-center">
        <p>{localTeamsState[0].team_name}</p>
        <p className="inline-block py-2 px-4 border border-solid border-gray-300 rounded font-display text-gray-600">
          {localTeamsState[0].team_name}
        </p>
      </div>
    );
  }

  const selectedValue = getSelectedTeam();

  return (
    <InfoCard title="Leaderboard" className="full-height">
      {/* Header */}
      <Box>
        <Box sx={{ minWidth: '260px' }}>
          {localTeamsState?.length === 1 ? (
            <p className="inline-block py-2 px-4 border border-solid border-gray-300 rounded font-display text-gray-600">
              {localTeamsState[0].team_name}
            </p>
          ) : (
            <Select
              items={transformTeamList()}
              selected={selectedValue?.value}
              onChange={event => setActiveTeam(event)}
              label="Selected Team"
            />
          )}
        </Box>
      </Box>
      {/* Body */}
      <Box sx={{ maxHeight: '360px', overflow: 'auto' }}>
        <List>{createList()}</List>
      </Box>
    </InfoCard>
  );
};

function LeaderbordBodyRow({
  person,
  rank,
  usersList,
  emoji,
  emojiQuantity,
  index,
}: {
  person: User | undefined;
  rank: number;
  usersList: User[];
  emoji: EmojiDataResponse;
  emojiQuantity: number;
  index: number;
}) {
  const getRank = (title?: string) => {
    if (index !== 0) {
      const prevRank = usersList[index - 1].rank;

      if (rank === prevRank || emojiQuantity === 0) return '';

      if (title) {
        return rank;
      }
      return `${rank}.`;
    }
    return rank;
  };

  return (
    <ListItem
      className={`rank rank-${rank ? getRank('title') : +index + 1}`}
      divider
    >
      <Box
        className="gap-32"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          fontWeight: 600,
          fontSize: '18px',
        }}
      >
        <Box
          className="gap-32"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p>{rank ? getRank() : `${+index + 1}.`}</p>
          <Box
            className="gap-8"
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: '40px',
                height: '40px',
                borderRadius: '100%',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <img src={person?.photo} alt="User" className="userpic-kudos" />
            </Box>

            <p>{person?.user_name ? person.user_name : person?.email}</p>
          </Box>
        </Box>
        <Box
          className="gap-8"
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <p>{emojiQuantity}</p>
          <div className="flex items-center">
            {emoji.map(emojiItem => (
              <em-emoji id={emojiItem} key={emojiItem} size={16} set="google" />
            ))}
          </div>
        </Box>
      </Box>
    </ListItem>
  );
}
