import {Player} from "system/GameStates/GameTypes";
import firebase from "firebase/compat/app";
import {randomInt} from "system/GameConstants";
import {DbReferences, ReferenceManager} from "system/Database/RoomDatabase";
import {TurnManager} from "system/GameStates/TurnManager";
import {RoomContextType} from "system/context/roomInfo/RoomContextProvider";
import {CardRole} from "system/cards/Card";

export function getDefaultName(): string {
    return `ㅇㅇ (${randomInt(1, 255)}.${randomInt(1, 255)})`;
}

export function getDefaultPlayer() {
    const newPlayer: Player = {
        isSpectating: false,
        lastActive: firebase.database.ServerValue.TIMESTAMP,
        lastClaimed: CardRole.None,
        name: getDefaultName(),
        icard: -2,
        coins: 0,
    };
    return newPlayer;
}

export async function joinLocalPlayer(
    turn: number,
    asHost: boolean
): Promise<string> {
    const playersRef = ReferenceManager.getRef(DbReferences.PLAYERS);
    const player = getDefaultPlayer();
    if (turn !== -1) {
        player.isSpectating = true;
        player.icard = -2;
    }
    const myRef = playersRef.push();
    await myRef.set(player);
    const myId = await myRef.key;
    if (asHost) {
        ReferenceManager.updateReference(DbReferences.HEADER_hostId, myId);
    }
    return myId!;
}

export function pushPlayerUpdate(
    ctx: RoomContextType,
    playerId: string,
    changer: (id: string, player: Player) => boolean
) {
    const [id, player] = TurnManager.getPlayerInfoById(ctx, playerId);
    const result = changer(id, player);
    if (!result) return;
    ReferenceManager.updatePlayerReference(id, player);
}
