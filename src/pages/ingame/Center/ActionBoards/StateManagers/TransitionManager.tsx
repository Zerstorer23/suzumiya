import {RoomContextType} from "system/context/roomInfo/room-context";
import {GameAction, TurnState} from "system/GameStates/GameTypes";
import {GameManager} from "system/GameStates/GameManager";
import {DbReferences, ReferenceManager} from "system/Database/RoomDatabase";
import {ActionType, BoardState, StateManager} from "system/GameStates/States";
import {TurnManager} from "system/GameStates/TurnManager";
import {CardRole} from "system/cards/Card";

/**
 *
 * @param ctx
 * @param changer : Changes state and returns if state should be applied
 */
export enum TransitionAction {
    Success,
    Abort,
    EndTurn
}

/**
 * Do something and END
 * DO chanes in CHanger.
 * Return results TransitionAction
 */
export function prepareAndPushState(ctx: RoomContextType, changer: (newAction: GameAction, newState: TurnState) => TransitionAction) {
    const [newAction, newState] = prepareActionState(ctx);
    const result = changer(newAction, newState);
    if (result === TransitionAction.Abort) {
        console.warn("Abort");
        console.trace("Aborted state");
        return;
    }
    if (result === TransitionAction.EndTurn) {
        setEndTurn(ctx, newState);
    }
    pushActionState(newAction, newState);
}

/**
 * Do nothing and End
 */
export function pushJustEndTurn(ctx: RoomContextType) {
    const [newAction, newState] = prepareActionState(ctx);
    setEndTurn(ctx, newState);
    pushActionState(newAction, newState);
}

function setEndTurn(ctx: RoomContextType, newState: TurnState) {
    newState.board = BoardState.ChoosingBaseAction;
    newState.turn = TurnManager.getNextTurn(newState.turn, ctx.room.playerMap.size);
}

/**
 * Prepares varialbes for puhsing new action
 * */
function prepareActionState(ctx: RoomContextType): [GameAction, TurnState] {
    const gameAction = GameManager.copyGameAction(ctx.room.game.action);
    return [gameAction, {...ctx.room.game.state}];
}

/**
 * Call this to apply action to DB
 */
function pushActionState(gameAction: GameAction, newState: TurnState) {
    ReferenceManager.updateReference(DbReferences.GAME_action, gameAction);
    ReferenceManager.updateReference(DbReferences.GAME_state, newState);
}


export function handleAcceptOrLie(ctx: RoomContextType, action: ActionType, myId: string): boolean {
    if (action === ActionType.IsALie) {
        pushIsALieState(ctx, myId);
        return true;
    }
    if (action === ActionType.Accept) {
        pushAcceptedState(ctx);
        return true;
    }
    return false;
}

export function pushIsALieState(ctx: RoomContextType, challengerId: string) {
    prepareAndPushState(ctx, (newAction, newState) => {
        const board = StateManager.getChallengedState(ctx.room.game.state.board);
        if (board === null) return TransitionAction.Abort;
        newState.board = board;
        newAction.challengerId = challengerId;
        const susCard = inferLieCard(ctx.room.game.state.board);
        if (susCard === CardRole.None) return TransitionAction.Abort;
        GameManager.setChallengeInfo(newAction, susCard);
        return TransitionAction.Success;
    });
}

function inferLieCard(board: BoardState): CardRole {
    //TODO
    switch (board) {
        case BoardState.CalledGetTwoBlocked:
        case BoardState.CalledGetThree:
            return CardRole.Duke;
        case BoardState.CalledChangeCards:
            return CardRole.Ambassador;
        case BoardState.CalledSteal:
            return CardRole.Captain;
        case BoardState.CalledAssassinate:
            return CardRole.Assassin;
        case BoardState.AssassinBlocked:
            return CardRole.Contessa;
    }
    return CardRole.None;
}

/**
 * Only use for ACTUAL ACCEPTED state
 * @param ctx
 */

export function pushAcceptedState(ctx: RoomContextType) {
    prepareAndPushState(ctx, (newAction, newState) => {
        const board = StateManager.getAcceptedState(ctx.room.game.state.board);
        if (board === null) return TransitionAction.Abort;
        newState.board = board;
        return TransitionAction.Success;
    });
}


export function pushCalledState(ctx: RoomContextType, action: ActionType, myId: string, targetId = "") {
    prepareAndPushState(ctx, (newAction, newState) => {
        const newBoard = StateManager.getCalledState(action);
        if (newBoard === null) return TransitionAction.Abort;
        newState.board = newBoard;
        newAction.pierId = myId;
        newAction.targetId = targetId;
        return TransitionAction.Success;
    });
}

export function pushPrepareDiscarding(ctx: RoomContextType, myId: string) {
    prepareAndPushState(ctx, (newAction, newState) => {
        newState.board = BoardState.DiscardingCard;
        newAction.param = GameManager.createRemovedCard(-1, myId);
        return TransitionAction.Success;
    });
}
