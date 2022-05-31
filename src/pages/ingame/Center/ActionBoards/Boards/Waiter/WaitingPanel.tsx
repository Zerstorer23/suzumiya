import classes from "pages/ingame/Center/ActionBoards/Boards/BaseBoard.module.css";
import { useContext } from "react";
import LocalContext from "system/context/localInfo/local-context";
import RoomContext from "system/context/room-context";
import { TurnManager } from "system/GameStates/TurnManager";
import { IProps } from "system/types/CommonTypes";
// type Props = IProps & {
//   isMyTurn: boolean;
// };
export default function WaitingPanel() {
  const ctx = useContext(RoomContext);
  const localCtx = useContext(LocalContext);
  const currId = TurnManager.getCurrentPlayerId(ctx, localCtx);
  const isMyTurn: boolean = TurnManager.isMyTurn(ctx, localCtx);
  if (isMyTurn) {
    return (
      <div className={classes.singleContainer}>
        <h1>Waiting for other player's reaction...</h1>
      </div>
    );
  } else {
    return (
      <div className={classes.singleContainer}>
        <h1>
          Waiting for player {ctx.room.playerMap.get(currId)?.name}'s action...
        </h1>
      </div>
    );
  }
}
