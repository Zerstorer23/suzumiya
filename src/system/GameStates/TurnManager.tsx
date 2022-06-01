import {LocalContextType, LocalField,} from "system/context/localInfo/local-context";
import {RoomContextType} from "system/context/roomInfo/room-context";
import {getNullable} from "system/GameConstants";
import {Player} from "system/GameStates/GameTypes";

export enum PlayerType {
    Pier,
    Target,
    Challenger,
}

export const TurnManager = {
    /**
     *
     * @returns TODO: use room hash to get first player
     */
    getFirstTurn(seed: number, playerSize: number): number {
        return seed % playerSize;
    },
    /**
     *
     * @returns Get next safe turn
     */
    getNextTurn(curr: number, playerSize: number): number {

        return (curr + 1) % playerSize;
    },
    /**
     *
     * @param ctx
     * @param localCtx
     * @returns this turn player's id
     */
    getCurrentPlayerId(ctx: RoomContextType, localCtx: LocalContextType) {
        return localCtx.getVal(LocalField.SortedList)[ctx.room.game.state.turn];
    },
    /**
     *
     * @param localCtx
     * @returns next turn player's id
     */
    getNextPlayerId(ctx: RoomContextType, localCtx: LocalContextType) {
        const nextTurn = this.getNextTurn(ctx.room.game.state.turn, ctx.room.playerMap.size);
        return localCtx.getVal(LocalField.SortedList)[nextTurn];
    },
    /**
     *
     * @param ctx
     * @param localCtx
     * @returns is this turn MY turn?
     */
    isMyTurn(ctx: RoomContextType, localCtx: LocalContextType) {
        return (
            localCtx.getVal(LocalField.Id) === this.getCurrentPlayerId(ctx, localCtx)
        );
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
        }
        return this.getPlayerInfoById(ctx, playerId);
    },
    getPlayerInfoById(
        ctx: RoomContextType,
        playerId: string
    ): [string, Player] {
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
