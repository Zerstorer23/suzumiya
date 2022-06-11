import React, { useCallback, useContext, useEffect, useRef } from "react";
import classes from "./ChatModule.module.css";
import ChatContext, {
  ChatContextType,
  ChatEntry,
  ChatEntryToElem,
  ChatFormat,
  sendChat,
} from "pages/components/ui/ChatModule/chatInfo/ChatContextProvider";
import LocalContext, {
  LocalContextType,
  LocalField,
} from "system/context/localInfo/local-context";
import { TurnManager } from "system/GameStates/TurnManager";
import RoomContext from "system/context/roomInfo/room-context";
import HorizontalLayout from "pages/components/ui/HorizontalLayout";
import { InputCursor } from "system/context/localInfo/LocalContextProvider";
import useKeyListener, { KeyCode } from "system/hooks/useKeyListener";
import { useTranslation } from "react-i18next";
import MusicContext, {
  MusicContextType,
  MusicResponse,
  pushMusicToQueue,
} from "pages/components/ui/MusicModule/musicInfo/MusicContextProvider";
import { Player } from "system/GameStates/GameTypes";
import {
  MAX_MUSIC_QUEUE,
  MAX_PERSONAL_QUEUE,
} from "pages/components/ui/MusicModule/MusicModule";
import { RoomContextType } from "system/context/roomInfo/RoomContextProvider";
import TransitionManager from "pages/ingame/Center/ActionBoards/StateManagers/TransitionManager";
import { insert } from "lang/i18nHelper";
import {
  DbReferences,
  ReferenceManager,
} from "system/Database/ReferenceManager";
import sendToPort, { connect } from "sendSocket/sendSocket";

const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);
export default function ChatModule() {
  const chatCtx = useContext(ChatContext);
  const ctx = useContext(RoomContext);
  const localCtx = useContext(LocalContext);
  const musicCtx = useContext(MusicContext);
  const { t } = useTranslation();

  const [myId, myPlayer] = TurnManager.getMyInfo(ctx, localCtx);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current!.scrollIntoView({ behavior: "smooth" });
  }, [chatCtx.chatList.length]);
  ///====Key listener====///
  useKeyListener([KeyCode.Enter], onKeyDown);

  function onKeyDown(keyCode: KeyCode) {
    if (keyCode === KeyCode.Undefined) return;
    if (document.activeElement === chatFieldRef.current!) {
      handleSend();
    } else {
      chatFieldRef.current!.focus();
    }
  }

  const handleSpecials = useCallback(
    (text: string) => {
      if (text.length < 2) return false;
      const firstChar = text.at(0);
      const theRest = text.substring(1);
      if (firstChar === "!") {
        handleMusic(t, chatCtx, musicCtx, theRest, myId, myPlayer);
      } else if (firstChar === "/") {
        handleCommands(t, ctx, localCtx, chatCtx, theRest);
      } else {
        return false;
      }
      return true;
    },
    [myId, chatCtx, musicCtx]
  );

  const handleSend = useCallback(() => {
    let text = chatFieldRef.current!.value.toString();
    chatFieldRef.current!.value = "";
    text = text.replaceAll(LF, ""); //LF
    text = text.replaceAll(CR, ""); //LF
    console.log(text.length);
    if (text.length <= 0) {
      chatFieldRef.current!.blur();
      return;
    }
    if (handleSpecials(text)) return;
    if (text.length > 128) {
      text = text.substring(0, 128);
    }
    sendChat(ChatFormat.normal, myPlayer.name, text);
    connect();
    sendToPort(text);
  }, [handleSpecials, myPlayer]);

  function toggleFocus(toggle: boolean) {
    localCtx.setVal(
      LocalField.InputFocus,
      toggle ? InputCursor.Chat : InputCursor.Idle
    );
  }

  function onFocus() {
    toggleFocus(true);
  }

  return (
    <div className={`${classes.container}`}>
      <div className={classes.chatbox}>
        {chatCtx.chatList.map((chat, index) => {
          return ChatEntryToElem(index, chat);
        })}
        <div ref={messagesEndRef} />
      </div>
      <HorizontalLayout className={classes.sendBox}>
        <textarea
          ref={chatFieldRef}
          className={classes.inputField}
          onBlur={() => {
            toggleFocus(false);
          }}
          onFocus={() => {
            onFocus();
          }}
        ></textarea>
        <button className={classes.buttonSend} onClick={handleSend}>
          {t("_send")}
        </button>
      </HorizontalLayout>
    </div>
  );
}

function handleMusic(
  t: any,
  chatCtx: ChatContextType,
  musicCtx: MusicContextType,
  videoId: string,
  myId: string,
  myPlayer: Player
) {
  const response = pushMusicToQueue(musicCtx, videoId, myId);
  switch (response) {
    case MusicResponse.Success:
      sendChat(
        ChatFormat.announcement,
        "",
        `${myPlayer.name}${t("_music_success_enqueue")}`
      );
      break;
    case MusicResponse.InvalidURL:
      chatCtx.loadChat({
        name: "",
        format: ChatFormat.announcement,
        msg: t("_music_invalid_url"),
      });
      break;
    case MusicResponse.FullQueue:
      chatCtx.loadChat({
        name: "",
        format: ChatFormat.announcement,
        msg: `${t("_music_queue_full")} (${MAX_MUSIC_QUEUE}max)`,
      });
      break;
    case MusicResponse.Overloading:
      chatCtx.loadChat({
        name: "",
        format: ChatFormat.announcement,
        msg: `${t("_music_personal_full")} (${MAX_PERSONAL_QUEUE}max)`,
      });
      break;
  }
}

function handleCommands(
  t: any,
  ctx: RoomContextType,
  localCtx: LocalContextType,
  chatCtx: ChatContextType,
  command: string
) {
  const args = command.split(" ");
  const amHost = TurnManager.amHost(ctx, localCtx);
  switch (args[0]) {
    case "next":
      //Push to next turn
      if (!amHost) return;
      TransitionManager.pushEndTurn(ctx);
      break;
    case "reset":
      if (!amHost) return;
      TransitionManager.pushLobby(ctx.room.header.games);
      break;
    case "coi":
    case "coin":
    case "coins":
      if (!amHost) return;
      if (ctx.room.header.games > 2) return;
      ReferenceManager.updateReference(
        DbReferences.HEADER_games,
        ctx.room.header.games + 5
      );
      chatCtx.loadChat({
        format: ChatFormat.announcement,
        name: "",
        msg: t("_coins_inserted"),
      });
      break;
    /*        case "kick"://reset and next is enough
                    if (!amHost) return;
                    kickPlayer(t, ctx, chatCtx, args);
                    break;*/
    case "help":
      printHelp(t, chatCtx);
      break;
    case "host":
      printHost(t, ctx, chatCtx);
      break;
  }
}

function printHost(t: any, ctx: RoomContextType, chatCtx: ChatContextType) {
  const hostId = ctx.room.header.hostId;
  const host = ctx.room.playerMap.get(hostId);
  if (host === undefined) return;

  const chatEntry: ChatEntry = {
    format: ChatFormat.announcement,
    name: "",
    msg: insert(t, "_cmd_host", host.name),
  };
  chatCtx.loadChat(chatEntry);
}

function printHelp(t: any, chatCtx: ChatContextType) {
  const chatEntry: ChatEntry = {
    format: ChatFormat.announcement,
    name: "",
    msg: t("_cmd_help"),
  };
  chatCtx.loadChat(chatEntry);
}

/*
function kickPlayer(t: any, ctx: RoomContextType, chatCtx: ChatContextType, args: string[]) {
    if (args.length < 2) return;
    const index = +args[1];
    console.log(ctx.room.playerList);
    const id = ctx.room.playerList[index];
    console.log("ID ", id);
    if (id === undefined) return;
    const ref = ReferenceManager.getPlayerReference(id);
    ref.remove();
    const player = ctx.room.playerMap.get(id);
    console.log("Found ", player);
    if (player === undefined) return null;
    sendChat(ChatFormat.important, "", insert(t, "_cmd_kick_player", player.name));
}
*/