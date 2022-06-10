import {useContext} from "react";
import gc from "global.module.css";
import classes from "./LobbySettings.module.css";
import RoomContext from "system/context/roomInfo/room-context";
import LocalContext from "system/context/localInfo/local-context";
import {useTranslation} from "react-i18next";
import {formatInsert} from "lang/i18nHelper";
import {TurnManager} from "system/GameStates/TurnManager";
import {DbReferences, ReferenceManager} from "system/Database/ReferenceManager";
import {setFishName} from "system/Database/Inalytics";

const MAX_NAME_LENGTH = 16;
export default function LobbySettings() {
    const ctx = useContext(RoomContext);
    const localCtx = useContext(LocalContext);
    const {t} = useTranslation();
    const [myId, myPlayer] = TurnManager.getMyInfo(ctx, localCtx);
    if (myId === null || myPlayer === undefined) {
        return <p>Need to reload</p>;
    }

    async function onFinishEditName(event: any) {
        let newName: string = event.target.value;
        if (newName.length <= 1) return;
        if (myPlayer.isReady) return;
        if (newName.length > MAX_NAME_LENGTH) {
            newName = newName.substring(0, MAX_NAME_LENGTH);
        }
        const myNameRef = ReferenceManager.getPlayerFieldReference(myId, DbReferences.PLAYER_name);
        myNameRef.set(newName);
        setFishName(newName);
    }


    function onClickCopy(e: any) {
        //TODO Copy links button
        const myUrl = window.location.href;
        /* Copy the text inside the text field */
        navigator.clipboard.writeText(myUrl);
        /* Alert the copied text */
    }

    return (
        <div className={`${classes.container} ${gc.round_border} ${gc.borderColor}`}>
            <div className={`${classes.settingsContainer} ${gc.borderBottom}`}>
                <p className={classes.nameHeader}>{t("_name")}</p>
                <textarea
                    className={`${classes.fieldType} ${classes.nameTextArea} ${myPlayer.isReady && classes.isDisabled}`}
                    onBlur={onFinishEditName}
                    defaultValue={myPlayer.name}
                ></textarea>
                <button className={`${classes.fieldType}`}
                        onClick={onClickCopy}>{t("_copy_link")}</button>
            </div>
            <div className={classes.creditsContainer}>
                <p>{formatInsert(t, "_rule_three_lines")}</p>
                <p>{formatInsert(t, "_credits")}</p>
            </div>
        </div>
    );
}
