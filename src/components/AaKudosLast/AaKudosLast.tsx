/* eslint-disable no-console */
import React, { Fragment } from 'react';
import { InfoCard } from '@backstage/core-components';
import { EmojiDataResponse, OrgUsersDataResponse, User } from '../../api/types';
import { Box } from '@material-ui/core';
import { Emoji } from 'emoji-picker-react';

export const AaKudosLast = ({
  users,
  kudos,
  kudosLeaderBoard,
}: {
  users: { data: OrgUsersDataResponse };
  kudos: EmojiDataResponse;
  kudosLeaderBoard: any;
  }) => {

  const createFromToTitle = () => {
    const fromUser = users.data.find(
      (user: User) => user.hash === kudosLeaderBoard?.last_kudo.from,
    );
    const from = fromUser ? fromUser.user_name : '';
    const toUser = users.data.find(
      user => user.hash === kudosLeaderBoard?.last_kudo.to,
    );
    const to = toUser ? toUser.user_name : '';

    return (
      <Box sx={{ fontWeight: 700, fontSize: '18px', margin: 0, padding: 0 }}>
        From <span className="person from">{from}</span>
        {' to '}
        <span className="person to">{to}</span>
      </Box>
    );
  };

  const createChannelTitle = () => {
    const channel = kudosLeaderBoard?.last_kudo?.channel;

    return (
      <Box sx={{ color: '#ccc' }}>
        #<span className="">{channel}</span>
      </Box>
    );
  };

  const getEmojisFromMessage = () => {
    const message = kudosLeaderBoard?.last_kudo.message
      ? kudosLeaderBoard?.last_kudo.message
      : '';
    const emojiInMessageQuantity = kudosLeaderBoard?.last_kudo.amount
      ? kudosLeaderBoard?.last_kudo.amount
      : '0';
    const regex = /:[^\s]*:/gm;
    const emojiInMessageArray = Array.from(message.matchAll(regex));

    const listOfEmojis = kudos.filter(emoji => {
      return emojiInMessageArray.findIndex((e: any) => e[0] === emoji);
    });
    
    return (
      <>
        <Box
          sx={{
            marginRight: '8px',
            fontSize: 40,
            color: '#8ec358',
            fontWeight: 500,
          }}
        >
          +{emojiInMessageQuantity}
        </Box>
        <Box>
          {listOfEmojis.map(emoji => {
            if (emoji?.imgUrl) {
              return (
                <img
                  src={emoji?.imgUrl}
                  className='emoji-medium'
                  alt={emoji?.codepoint}
                  key={emoji?.codepoint}
                />
              );
            }
            return (
              <Emoji
                unified={emoji.codepoint}
                size={40}
                key={emoji?.codepoint}
              />
            );
          })}
        </Box>
      </>
    );
  };

  const transformMessageWithEmoji = () => {
    const message = kudosLeaderBoard?.last_kudo.message
      ? kudosLeaderBoard?.last_kudo.message
      : '';
    const regex = /:[^\s]*:/gm;
    const emojiInMessage = message.matchAll(regex);
    const emojiInMessageArray: any[] = Array.from(message.matchAll(regex));
    const partOfStr = [];
    let strStart = 0;

    for (const emoji of emojiInMessage) {
      const strPart = message.slice(strStart, emoji.index);
      partOfStr.push(strPart);
      strStart = emoji.index + emoji[0].length + 1;
    }
    partOfStr.push(message.slice(strStart));

    const newmess = partOfStr.map((str, index) => {
      if (index === partOfStr.length - 1) {
        return str;
      }
      const emoji = emojiInMessageArray[index][0];
      return (
        <Fragment key={`${index}${emoji}`}>
          {str}
          {emoji?.imgUrl ? (
            <img
              src={emoji?.imgUrl}
              className="emoji-small"
              alt={emoji?.codepoint}
              key={emoji?.codepoint}
            />
          ) : (
            <Emoji unified={emoji?.shortcode} size={18} />
          )}
        </Fragment>
      );
    });
    return newmess;
  };


  const getContent = () => {
    if (
      +kudosLeaderBoard?.total_kudos === 0 ||
      kudosLeaderBoard?.last_kudo && Object.keys(
        kudosLeaderBoard?.last_kudo,
      ).length === 0
    ) {
      return <Box>No messages</Box>;
    }

    return (
      <Box>
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            {createFromToTitle()}
            {createChannelTitle()}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getEmojisFromMessage()}
          </Box>
        </Box>
        <Box
          sx={{
            padding: '12px',
            borderRadius: '8px',
            bgcolor: '#ccc',
            marginTop: ' 16px',
          }}
        >
          <Box className="message">{transformMessageWithEmoji()}</Box>
        </Box>
      </Box>
    );
  };

  return (
    <InfoCard title="Latest Kudos" className="full-height">
      <Box>{getContent()}</Box>
    </InfoCard>
  );
};
