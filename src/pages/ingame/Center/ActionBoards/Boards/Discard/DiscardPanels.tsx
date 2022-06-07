import {Fragment, useContext, useEffect} from "react";
import RoomContext from "system/context/roomInfo/room-context";
import LocalContext from "system/context/localInfo/local-context";
import {TurnManager} from "system/GameStates/TurnManager";
import {CardRole} from "system/cards/Card";
import {DeckManager} from "system/cards/DeckManager";
import {KillInfo, Player} from "system/GameStates/GameTypes";
import classes from "pages/ingame/Center/ActionBoards/Boards/BaseBoard.module.css";
import BaseActionButton from "pages/ingame/Center/ActionBoards/Boards/ActionButtons/BaseActionButton";
import {handleCardKill} from "pages/ingame/Center/ActionBoards/Boards/Discard/DiscardSolver";
import {CardPool} from "system/cards/CardPool";
import {useShortcutEffect} from "system/hooks/useShortcut";
import {useTranslation} from "react-i18next";
import {formatInsert} from "lang/i18nHelper";
import {RoomContextType} from "system/context/roomInfo/RoomContextProvider";

const MAX_PCARD = 2;

export function MyCardsPanel(): JSX.Element {
    const ctx = useContext(RoomContext);
    const localCtx = useContext(LocalContext);
    const deck = ctx.room.game.deck;
    const [myId, localPlayer] = TurnManager.getMyInfo(ctx, localCtx);
    const myCards: CardRole[] = DeckManager.peekCards(deck, localPlayer.icard, MAX_PCARD);
    const {t} = useTranslation();
    const keyInfo = useShortcutEffect(MAX_PCARD);
    useEffect(() => {
        const index = keyInfo.index;
        if (index < 0) return;
        onMakeAction(index);
    }, [keyInfo]);

    function onMakeAction(index: number) {
        const myIndex = localPlayer.icard + index;
        const card = deck[myIndex];
        if (DeckManager.isDead(card) || card === CardRole.None) return;
        handleCardKill(t, ctx, myIndex);
    }

    return (
        <Fragment>
            <div className={classes.header}>Choose a card to discard...</div>
            <div className={classes.container}>
                {myCards.map((role: CardRole, index: number) => {
                    return (
                        <BaseActionButton
                            key={index}
                            index={index}
                            param={CardPool.getCard(
                                DeckManager.isDead(role) ? CardRole.None : role
                            )}
                            onClickButton={() => {
                                onMakeAction(index);
                            }}
                        />
                    );
                })}
            </div>
        </Fragment>
    );
}

export function PostKillPanel(): JSX.Element {
    const ctx = useContext(RoomContext);
    const {t} = useTranslation();
    const info = ctx.room.game.action.param as KillInfo;
    const player = ctx.room.playerMap.get(info.ownerId)!;
    const cardRole = ctx.room.game.deck[info.removed[0]];
    let secondElem = <Fragment/>;
    if (info.removed[1] >= 0) {
        const secCard = ctx.room.game.deck[info.removed[1]];
        secondElem = <p>{formatInsert(t, "_discard_result_challenge", player.name,
            CardPool.getCard(secCard).getName(t))}</p>;
    }

    if (player === undefined) return <Fragment/>;
    const isDead = DeckManager.playerIsDead(ctx.room.game.deck, player);
    return (
        <Fragment>
            <p>{formatInsert(t, "_discard_result", player.name,
                CardPool.getCard(cardRole).getName(t))}</p>
            {secondElem}
            {isDead && <p>{formatInsert(t, "_is_removed", player.name)}</p>}
        </Fragment>
    );
}

export function autoKillCard(t: any, ctx: RoomContextType, player: Player) {
    let card = ctx.room.game.deck[player.icard];
    if (DeckManager.isDead(card)) {
        handleCardKill(t, ctx, player.icard);
    } else {
        handleCardKill(t, ctx, player.icard + 1);
    }
}