import { db } from "system/Database/Firebase";
import { joinLocalPlayer } from "system/Database/PlayerDatabase";
import { Player, PlayerMap, Room } from "system/GameStates/GameTypes";
import {
  getDefaultRoom,
  getSortedListFromMap,
} from "system/GameStates/RoomGenerator";
import { DbRef, Listeners, ListenerTypes } from "system/types/CommonTypes";

export enum DbReferences {
  ROOM = "/",
  GAME = "/game",
  GAME_deck = `/game/deck`,
  GAME_state = `/game/state`,
  GAME_action = `/game/action`,
  PLAYERS = `/playerMap`,
  HEADER = `/header`,
  HEADER_hostId = `/header/hostId`,
  HEADER_seed = `/header/seed`,
}

/**
 * Reference Manager is responsible for
 * uploading data to Firebase.
 */
export const ReferenceManager = {
  /**
   * @param field
   * @param value
   * UPdates a single value
   */
  updateReference<T>(field: DbReferences, value: T) {
    const ref = this.getRef(field);
    ref.set(value);
  },
  /**
   *
   * @param playerId
   * @param player
   * UPdates a player
   */
  updatePlayerReference(playerId: string, player: Player) {
    const ref = ReferenceManager.getPlayerReference(playerId);
    ref.set(player);
  },
  getRoomRef(): DbRef {
    return this.getRef(DbReferences.ROOM);
  },
  getRef(refName: DbReferences): DbRef {
    //NOTE USE DB TAGS
    return db.ref(refName);
  },
  getPlayerReference(playerId: string): DbRef {
    return db.ref(`${DbReferences.PLAYERS}/${playerId}`);
  },
};

export async function initialiseRoom(turn: number) {
  const roomRef = ReferenceManager.getRoomRef();
  const defaultRoom = getDefaultRoom();
  await roomRef.set(defaultRoom);
  const myId = await joinLocalPlayer(turn, true);
  return myId;
}

export async function joinLobby(turn: number): Promise<string> {
  return await joinLocalPlayer(turn, false);
}

export async function loadRoom(): Promise<Room> {
  const roomRef = ReferenceManager.getRoomRef();
  const snapshot = await roomRef.get();
  if (!snapshot.exists()) {
    return getDefaultRoom();
  } else {
    const room: Room = snapshot.val();
    if (room["playerMap"] === undefined) {
      room.playerMap = new Map<string, Player>();
    }
    room.playerMap = parsePlayerMap(room.playerMap);
    room.playerList = getSortedListFromMap(room.playerMap);
    console.log("LOaded room");
    console.log(room);
    return room;
  }
}

function parseGame(listeners: Listeners) {
  listeners.set(
    ListenerTypes.Deck,
    ReferenceManager.getRef(DbReferences.GAME_deck)
  );
  listeners.set(
    ListenerTypes.State,
    ReferenceManager.getRef(DbReferences.GAME_state)
  );
  listeners.set(
    ListenerTypes.gameAction,
    ReferenceManager.getRef(DbReferences.GAME_action)
  );
}

function parseHeader(listeners: Listeners) {
  const headerRef = ReferenceManager.getRef(DbReferences.HEADER);
  listeners.set(ListenerTypes.Header, headerRef);

  const playersRef = ReferenceManager.getRef(DbReferences.PLAYERS);
  listeners.set(ListenerTypes.PlayerList, playersRef);
}

function parseListeners(): Listeners {
  const listeners = new Map<ListenerTypes, DbRef>();
  parseGame(listeners);
  parseHeader(listeners);
  return listeners;
}

function parsePlayerMap(roomMap: PlayerMap): PlayerMap {
  const playerMap = new Map<string, Player>();
  if (roomMap === undefined) return playerMap;
  Object.entries(roomMap).forEach(([key, value]) => {
    playerMap.set(key, value);
  });
  return playerMap;
}

export function registerListeners(): Listeners {
  const listeners = parseListeners();
  return listeners;
}
