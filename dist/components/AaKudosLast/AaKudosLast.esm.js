import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { Fragment as Fragment$1 } from 'react';
import { Box } from '@material-ui/core';
import { Emoji } from 'emoji-picker-react';
import { Card, CardHeader, Text, CardBody } from '@backstage/ui';

const AaKudosLast = ({
  users,
  kudos,
  kudosLeaderBoard
}) => {
  const createFromToTitle = () => {
    const fromUser = users.data.find(
      (user) => user.hash === kudosLeaderBoard?.last_kudo.from
    );
    const from = fromUser ? fromUser.user_name : "";
    const toUser = users.data.find(
      (user) => user.hash === kudosLeaderBoard?.last_kudo.to
    );
    const to = toUser ? toUser.user_name : "";
    return /* @__PURE__ */ jsxs(Box, { sx: { fontWeight: 700, fontSize: "18px", margin: 0, padding: 0 }, children: [
      "From ",
      /* @__PURE__ */ jsx("span", { className: "person from", children: from }),
      " to ",
      /* @__PURE__ */ jsx("span", { className: "person to", children: to })
    ] });
  };
  const createChannelTitle = () => {
    const channel = kudosLeaderBoard?.last_kudo?.channel;
    return /* @__PURE__ */ jsxs(Box, { sx: { color: "#ccc" }, children: [
      "#",
      /* @__PURE__ */ jsx("span", { className: "", children: channel })
    ] });
  };
  const getEmojisFromMessage = () => {
    const message = kudosLeaderBoard?.last_kudo.message ? kudosLeaderBoard?.last_kudo.message : "";
    const emojiInMessageQuantity = kudosLeaderBoard?.last_kudo.amount ? kudosLeaderBoard?.last_kudo.amount : "0";
    const regex = /:[^\s]*:/gm;
    const emojiInMessageArray = Array.from(message.matchAll(regex));
    const listOfEmojis = kudos.filter((emoji) => {
      return emojiInMessageArray.findIndex((e) => e[0] === emoji);
    });
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(
        Box,
        {
          sx: {
            marginRight: "8px",
            fontSize: 40,
            color: "#8ec358",
            fontWeight: 500
          },
          children: [
            "+",
            emojiInMessageQuantity
          ]
        }
      ),
      /* @__PURE__ */ jsx(Box, { children: listOfEmojis.map((emoji) => {
        if (emoji?.imgUrl) {
          return /* @__PURE__ */ jsx(
            "img",
            {
              src: emoji?.imgUrl,
              style: { width: "40px", height: "40px" },
              alt: emoji?.codepoint
            },
            emoji?.codepoint
          );
        }
        return /* @__PURE__ */ jsx(
          Emoji,
          {
            unified: emoji.codepoint,
            size: 40
          },
          emoji?.codepoint
        );
      }) })
    ] });
  };
  const transformMessageWithEmoji = () => {
    const message = kudosLeaderBoard?.last_kudo.message ? kudosLeaderBoard?.last_kudo.message : "";
    const regex = /:[^\s]*:/gm;
    const emojiInMessage = message.matchAll(regex);
    const emojiInMessageArray = Array.from(message.matchAll(regex));
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
      return /* @__PURE__ */ jsxs(Fragment$1, { children: [
        str,
        emoji?.imgUrl ? /* @__PURE__ */ jsx(
          "img",
          {
            src: emoji?.imgUrl,
            style: { width: "18px", height: "18px" },
            alt: emoji?.codepoint
          },
          emoji?.codepoint
        ) : /* @__PURE__ */ jsx(Emoji, { unified: emoji?.shortcode, size: 18 })
      ] }, `${index}${emoji}`);
    });
    return newmess;
  };
  const getContent = () => {
    if (+kudosLeaderBoard?.total_kudos === 0 || kudosLeaderBoard?.last_kudo && Object.keys(
      kudosLeaderBoard?.last_kudo
    ).length === 0) {
      return /* @__PURE__ */ jsx(Box, { children: "No messages" });
    }
    return /* @__PURE__ */ jsxs(Box, { children: [
      /* @__PURE__ */ jsxs(
        Box,
        {
          sx: {
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          },
          children: [
            /* @__PURE__ */ jsxs(Box, { children: [
              createFromToTitle(),
              createChannelTitle()
            ] }),
            /* @__PURE__ */ jsx(Box, { sx: { display: "flex", alignItems: "center" }, children: getEmojisFromMessage() })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        Box,
        {
          sx: {
            padding: "12px",
            borderRadius: "8px",
            bgcolor: "#ccc",
            marginTop: " 16px"
          },
          children: /* @__PURE__ */ jsx(Box, { className: "message", children: transformMessageWithEmoji() })
        }
      )
    ] });
  };
  return /* @__PURE__ */ jsxs(Card, { style: { height: "100%" }, children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(Text, { variant: "title-medium", weight: "bold", children: "Latest Kudos" }) }),
    /* @__PURE__ */ jsx(CardBody, { children: getContent() })
  ] });
};

export { AaKudosLast };
//# sourceMappingURL=AaKudosLast.esm.js.map
