/* eslint-disable no-console */
import React, { Fragment } from 'react';
import { InfoCard } from '@backstage/core-components';
import { EmojiDataResponse, OrgUsersDataResponse, User } from '../../api/types';
import { Box } from '@material-ui/core';
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

export const AaKudosTotal = ({
  users,
  kudos,
  kudosLeaderBoard,
}: {
  users: { data: OrgUsersDataResponse };
  kudos: EmojiDataResponse;
  kudosLeaderBoard: any;
}) => {
  
  const createEmojiList = () => {
    return kudos.map(emoji => (
      <em-emoji id={emoji} key={emoji} size={60} set="google" />
    ));
  };

  const createContent = () => {
    if (kudosLeaderBoard.total_kudos !== null) {
      if (+kudosLeaderBoard.total_kudos === 0) {
        return (
          <p className="font-display text-center text-gray-500 text-xl p-4">
            No kudos
          </p>
        );
      }

      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              marginRight: '36px',
              fontSize: 60,
              color: '#8ec358',
              fontWeight: 500,
            }}
          >
            +{kudosLeaderBoard.total_kudos}
          </Box>
          <div className="kudos-total__emojis">{createEmojiList()}</div>
        </Box>
      );
    }

    return (
      <p className="text-center text-gray-500 text-xl p-4">
        No team data
      </p>
    );
  };

  return (
    <InfoCard title="Total kudos this timeperiod" className='full-height'>
      <Box>{createContent()}</Box>
    </InfoCard>
  );
};
