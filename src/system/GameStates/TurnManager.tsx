import {LocalContextType, LocalField,} from "system/context/localInfo/local-context";
import {getNullable} from "system/GameConstants";
import {Player, PlayerMap} from "system/GameStates/GameTypes";
import {RoomContextType} from "system/context/roomInfo/RoomContextProvider";

export enum PlayerType {
    Pier,
    Target,
    Challenger,
    CurrentTurn,
}

export const TurnManager = {
    /**
     *
     * @returns  use room hash to get first player
     */
    getFirstTurn(seed: number, playerSize: number): number {
        return seed % playerSize;
    },
    /**
     *
     * @returns Get next safe turn
     */
    getNextTurn(playerMap: PlayerMap, playerList: string[], turn: number, startWithIncrement = true): number {
        let newTurn = (startWithIncrement) ? turn + 1 : turn;
        newTurn %= playerList.length;
        let currPlayer = playerMap.get(playerList[newTurn]);
        while (currPlayer?.isSpectating) {
            newTurn = (newTurn + 1) % playerList.length;
            currPlayer = playerMap.get(playerList[newTurn]);
        }
        return newTurn;
    },
    amHost(ctx: RoomContextType, localCtx: LocalContextType) {
        const myId = localCtx.getVal(LocalField.Id);
        return ctx.room.header.hostId === myId;
    },
    /**
     *
     * @param ctx
     * @returns this turn player's id
     */
    getCurrentPlayerId(ctx: RoomContextType) {
        return ctx.room.playerList[ctx.room.game.state.turn];
    },
    /**
     *
     * @param ctx
     * @returns next turn player's id
     */
    getNextPlayerId(ctx: RoomContextType) {
        const nextTurn = this.getNextTurn(
            ctx.room.playerMap,
            ctx.room.playerList,
            ctx.room.game.state.turn
        );
        return ctx.room.playerList[nextTurn];
    },
    /**
     *
     * @param ctx
     * @param localCtx
     * @returns is this turn MY turn?
     */
    isMyTurn(ctx: RoomContextType, localCtx: LocalContextType) {
        return localCtx.getVal(LocalField.Id) === this.getCurrentPlayerId(ctx);
    },
    /**
     *
     * @param ctx
     * @param localCtx
     * @returns My player Id , my Player
     */
    getMyInfo(
        ctx: RoomContextType,
        localCtx: LocalContextType
    ): [string, Player] {
        return this.getPlayerInfoById(ctx, localCtx.getVal(LocalField.Id));
    },
    getPlayerInfo(
        ctx: RoomContextType,
        playerType: PlayerType
    ): [string, Player] {
        let playerId = "";
        switch (playerType) {
            case PlayerType.Pier:
                playerId = ctx.room.game.action.pierId;
                break;
            case PlayerType.Target:
                playerId = ctx.room.game.action.targetId;
                break;
            case PlayerType.Challenger:
                playerId = ctx.room.game.action.challengerId;
                break;
            case PlayerType.CurrentTurn:
                playerId = ctx.room.playerList[ctx.room.game.state.turn];
                break;
        }
        return this.getPlayerInfoById(ctx, playerId);
    },
    getPlayerInfoById(ctx: RoomContextType, playerId: string): [string, Player] {
        const player = ctx.room.playerMap.get(playerId)!;
        return [playerId, player];
    },
    /**
     *
     * @param ctx
     * @returns Players who are related to this game,
     * Pier, Target, Challenger
     */
    getShareholders(
        ctx: RoomContextType
    ): [Player | null, Player | null, Player | null] {
        const action = ctx.room.game.action;
        const playerMap = ctx.room.playerMap;
        const pier = getNullable<Player>(playerMap, action.pierId);
        const target = getNullable<Player>(playerMap, action.targetId);
        const challenger = getNullable<Player>(playerMap, action.challengerId);
        return [pier, target, challenger];
    },
};