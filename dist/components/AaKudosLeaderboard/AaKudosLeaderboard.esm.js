import { jsxs, jsx } from 'react/jsx-runtime';
import { Select } from '@backstage/core-components';
import { List, ListItem } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import { Emoji } from 'emoji-picker-react';
import { Card, CardHeader, Text, CardBody } from '@backstage/ui';

const AaKudosLeaderboard = ({
  localTeamsState,
  selectedTeam,
  setActiveTeam,
  teamsState,
  users,
  kudos,
  kudosLeaderBoard,
  timeperiod
}) => {
  const transformTeamList = () => {
    const transformed = localTeamsState.map((team) => {
      return {
        value: team.team_hash,
        label: team.team_name
      };
    });
    return transformed?.length ? transformed : [];
  };
  const getSelectedTeam = () => {
    const selected = transformTeamList().find(
      (team) => team.value === selectedTeam
    );
    return selected ? selected : { value: "all", label: "Overall" };
  };
  const createList = () => {
    if (selectedTeam === "all") {
      const teamUsers = users?.data.map((user) => user.hash);
      if (teamUsers.length === 0) {
        return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("p", { className: "font-display text-center text-gray-500 text-xl p-4", children: "No users in team" }) });
      }
      const sortedList = kudosLeaderBoard?.team_members_list.length > 0 ? [...kudosLeaderBoard?.team_members_list] : teamUsers.map((userHash) => ({
        hash: userHash,
        emoji_quantity: 0,
        rank: 1
      }));
      return sortedList.map((userData, index) => {
        return /* @__PURE__ */ jsx(
          LeaderbordBodyRow,
          {
            emoji: kudos,
            person: users.data.find((user) => user.hash === userData.hash),
            rank: userData.rank,
            emojiQuantity: userData.emoji_quantity,
            usersList: sortedList,
            index
          },
          userData.hash
        );
      });
    }
    const currentTeam = localTeamsState.find(
      (team) => team.team_hash === selectedTeam
    );
    if (currentTeam) {
      const teamUsers = currentTeam?.users_in_team;
      if (teamUsers.length === 0 || teamUsers.length === 1 && teamUsers[0] === "") {
        return /* @__PURE__ */ jsx("li", { className: "flex-grow", children: /* @__PURE__ */ jsx("p", { className: "font-display text-center text-gray-500 text-xl p-4", children: "No users in team" }) });
      }
      const sortedList = kudosLeaderBoard?.team_members_list.length > 0 ? [...kudosLeaderBoard?.team_members_list] : teamUsers.map((userHash) => ({
        hash: userHash,
        emoji_quantity: 0,
        rank: 1
      }));
      return sortedList.map((userData, index) => {
        return /* @__PURE__ */ jsx(
          LeaderbordBodyRow,
          {
            emoji: kudos,
            person: users.data.find((user) => user.hash === userData.hash),
            rank: userData.rank,
            usersList: sortedList,
            emojiQuantity: userData.emoji_quantity,
            index
          },
          userData.hash
        );
      });
    }
    return null;
  };
  if (localTeamsState.length === 1) {
    return /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsx("p", { children: localTeamsState[0].team_name }),
      /* @__PURE__ */ jsx("p", { className: "inline-block py-2 px-4 border border-solid border-gray-300 rounded font-display text-gray-600", children: localTeamsState[0].team_name })
    ] });
  }
  const selectedValue = getSelectedTeam();
  return /* @__PURE__ */ jsxs(Card, { style: { height: "100%" }, children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(Text, { variant: "title-medium", weight: "bold", children: "Leaderboard" }),
      /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Box, { sx: { minWidth: "260px" }, children: localTeamsState?.length === 1 ? /* @__PURE__ */ jsx("p", { className: "inline-block py-2 px-4 border border-solid border-gray-300 rounded font-display text-gray-600", children: localTeamsState[0].team_name }) : /* @__PURE__ */ jsx(
        Select,
        {
          items: transformTeamList(),
          selected: selectedValue?.value,
          onChange: (event) => setActiveTeam(event),
          label: "Selected Team"
        }
      ) }) })
    ] }),
    /* @__PURE__ */ jsx(CardBody, { children: /* @__PURE__ */ jsx(Box, { sx: { maxHeight: "360px", overflow: "auto" }, children: /* @__PURE__ */ jsx(List, { children: createList() }) }) })
  ] });
};
function LeaderbordBodyRow({
  person,
  rank,
  usersList,
  emoji,
  emojiQuantity,
  index
}) {
  const getRank = (title) => {
    if (index !== 0) {
      const prevRank = usersList[index - 1].rank;
      if (rank === prevRank || emojiQuantity === 0) return "";
      if (title) {
        return rank;
      }
      return `${rank}.`;
    }
    return rank;
  };
  const outerBoxStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    fontWeight: 600,
    fontSize: "18px",
    gap: "32px"
  };
  const innerBoxStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "32px"
  };
  const xsStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  };
  return /* @__PURE__ */ jsx(
    ListItem,
    {
      className: `rank rank-${rank ? getRank("title") : +index + 1}`,
      divider: true,
      children: /* @__PURE__ */ jsxs(Box, { sx: outerBoxStyle, children: [
        /* @__PURE__ */ jsxs(Box, { sx: innerBoxStyle, children: [
          /* @__PURE__ */ jsx("p", { children: rank ? getRank() : `${+index + 1}.` }),
          /* @__PURE__ */ jsxs(Box, { sx: xsStyle, children: [
            /* @__PURE__ */ jsx(
              Box,
              {
                sx: {
                  width: "40px",
                  height: "40px",
                  borderRadius: "100%",
                  overflow: "hidden",
                  position: "relative"
                },
                children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: person?.photo,
                    alt: "User",
                    className: "userpic-kudos",
                    style: { width: "40px", height: "40px" }
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx("p", { children: person?.user_name ? person.user_name : person?.email })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Box, { className: "gap-8", sx: xsStyle, children: [
          /* @__PURE__ */ jsx("p", { children: emojiQuantity }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center", children: emoji.map((emojiItem) => {
            if (emojiItem?.imgUrl) {
              return /* @__PURE__ */ jsx(
                "img",
                {
                  src: emojiItem?.imgUrl,
                  alt: emojiItem?.shortcode,
                  style: { width: "16px", height: "16px" }
                },
                emojiItem?.codepoint
              );
            }
            return /* @__PURE__ */ jsx(
              Emoji,
              {
                unified: emojiItem.codepoint,
                size: 16
              },
              emojiItem?.codepoint
            );
          }) })
        ] })
      ] })
    }
  );
}

export { AaKudosLeaderboard };
//# sourceMappingURL=AaKudosLeaderboard.esm.js.map
