import BaseActionButton from "pages/ingame/Center/ActionBoards/Boards/ActionButtons/BaseActionButton";
import classes from "pages/ingame/Center/ActionBoards/Boards/BaseBoard.module.css";
import {Fragment, useContext, useEffect, useState} from "react";
import LocalContext, {LocalField,} from "system/context/localInfo/local-context";
import RoomContext from "system/context/roomInfo/room-context";
import {actionPool} from "system/GameStates/ActionInfo";
import {ActionType, BoardState, StateManager} from "system/GameStates/States";
import TransitionManager from "pages/ingame/Center/ActionBoards/StateManagers/TransitionManager";
import {useShortcutEffect} from "system/hooks/useShortcut";
import {useTranslation} from "react-i18next";
/*
    case BoardState.CalledGetThree:
    case BoardState.CalledChangeCards:
    case BoardState.CalledSteal:
    case BoardState.CalledAssassinate:
    case BoardState.AidBlocked:
    case BoardState.StealBlocked:
    case BoardState.AssassinBlocked:

    This is a board when someone called and see if we want to challenge it or not.
    So only intersted in challenge state.
*/
const actionsAcceptable = [ActionType.Accept, ActionType.IsALie];
const actionsNonAcceptable = [ActionType.None, ActionType.IsALie];
export default function CounterBoard(): JSX.Element {

    const ctx = useContext(RoomContext);
    const localCtx = useContext(LocalContext);
    const myId = localCtx.getVal(LocalField.Id);
    const board = ctx.room.game.state.board;
    const gameAction = ctx.room.game.action;
    const [actions, setActions] = useState<ActionType[]>(actionsAcceptable);
    const {t} = useTranslation();
    useEffect(() => {
        let actions = actionsNonAcceptable;
        if (StateManager.pierIsBlocked(board) && myId === gameAction.pierId) {
            actions = actionsAcceptable;
        }
//        (StateManager.pierIsBlocked(board)) ? actionsAcceptable : actionsNonAcceptable
        setActions(actions);
    }, [board]);
    const keyInfo = useShortcutEffect(actions.length);
    useEffect(() => {
        if (keyInfo.index < 0) return;
        onMakeAction(actions[keyInfo.index]);
    }, [keyInfo]);

    function handleAccept(board: BoardState) {
        if (!StateManager.pierIsBlocked(board)) return;
        TransitionManager.pushAcceptedState(ctx);
    }

    const onMakeAction = (action: ActionType) => {
        //NOTE in some states, we are actually interested in this.
        switch (action) {
            case ActionType.Accept:
                handleAccept(board);
                break;
            case ActionType.IsALie:
                TransitionManager.pushIsALieState(ctx, myId);
                break;
        }
    };


    return (
        <Fragment>
            <div className={classes.header}>{t("_react_action")}</div>
            <div className={classes.container}>
                {actions.map((action: ActionType, index: number) => {
                    return (
                        <BaseActionButton
                            key={index}
                            index={index}
                            param={actionPool.get(action)}
                            onClickButton={() => {
                                onMakeAction(action);
                            }}
                        />
                    );
                })}
            </div>
        </Fragment>
    );
}