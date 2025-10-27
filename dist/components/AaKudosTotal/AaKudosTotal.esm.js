import { jsxs, jsx } from 'react/jsx-runtime';
import { Box } from '@material-ui/core';
import { Emoji } from 'emoji-picker-react';
import { Card, CardHeader, Text, CardBody } from '@backstage/ui';

const AaKudosTotal = ({
  users,
  kudos,
  kudosLeaderBoard
}) => {
  const createEmojiList = () => {
    return kudos.map((emoji) => {
      if (emoji?.imgUrl) {
        return /* @__PURE__ */ jsx(
          "img",
          {
            src: emoji?.imgUrl,
            alt: emoji?.shortcode,
            style: { width: "52px", height: "52px" }
          },
          emoji?.codepoint
        );
      }
      return /* @__PURE__ */ jsx(
        Emoji,
        {
          unified: emoji.codepoint,
          size: 60
        },
        emoji?.codepoint
      );
    });
  };
  const createContent = () => {
    if (kudosLeaderBoard?.total_kudos !== null) {
      if (+kudosLeaderBoard?.total_kudos === 0) {
        return /* @__PURE__ */ jsx("p", { className: "font-display text-center text-gray-500 text-xl p-4", children: "No kudos" });
      }
      return /* @__PURE__ */ jsxs(
        Box,
        {
          sx: {
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          },
          children: [
            /* @__PURE__ */ jsxs(
              Box,
              {
                sx: {
                  marginRight: "36px",
                  fontSize: 60,
                  color: "#8ec358",
                  fontWeight: 500
                },
                children: [
                  "+",
                  kudosLeaderBoard?.total_kudos ? kudosLeaderBoard?.total_kudos : 0
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "kudos-total__emojis", children: createEmojiList() })
          ]
        }
      );
    }
    return /* @__PURE__ */ jsx("p", { className: "text-center text-gray-500 text-xl p-4", children: "No team data" });
  };
  return /* @__PURE__ */ jsxs(Card, { style: { height: "100%" }, children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(Text, { variant: "title-medium", weight: "bold", children: "Total kudos this timeperiod" }) }),
    /* @__PURE__ */ jsx(CardBody, { children: createContent() })
  ] });
};

export { AaKudosTotal };
//# sourceMappingURL=AaKudosTotal.esm.js.map
