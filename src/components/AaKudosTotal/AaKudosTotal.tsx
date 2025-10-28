/* eslint-disable no-console */
import { EmojiDataResponse, OrgUsersDataResponse } from '../../api/types';
import { Box } from '@material-ui/core';
import { Emoji } from 'emoji-picker-react';
import { Card, CardHeader, CardBody, Text } from '@backstage/ui';

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
    return kudos.map(emoji => {if (emoji?.imgUrl) {
      return (
        <img
          src={emoji?.imgUrl}
          alt={emoji?.shortcode}
          key={emoji?.codepoint}
          style={{ width: '52px', height: '52px' }}
        />
      );
    }
    return (
      <Emoji
        unified={emoji.codepoint}
        size={60}
        key={emoji?.codepoint}
      />
    );});
  };

  const createContent = () => {
    if (kudosLeaderBoard?.total_kudos !== null) {
      if (+kudosLeaderBoard?.total_kudos === 0) {
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
            +
            {kudosLeaderBoard?.total_kudos
              ? kudosLeaderBoard?.total_kudos
              : 0}
          </Box>
          <div className="kudos-total__emojis">{createEmojiList()}</div>
        </Box>
      );
    }

    return (
      <p className="text-center text-gray-500 text-xl p-4">No team data</p>
    );
  };

  return (
    <Card style={{ height: '100%' }}>
          <CardHeader>
            <Text variant="title-medium" weight="bold">
              Total kudos this timeperiod
            </Text>
          </CardHeader>
          <CardBody>{createContent()}</CardBody>
        </Card>
  );
};
