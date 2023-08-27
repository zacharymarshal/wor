import GameLoop from "./game/GameLoop.js";
import { makeStore } from "./game/store.js";
import { startingHandler, startGame } from "./game/starting.js";
import { startedHandler, addUnit, startBattle } from "./game/started.js";
import TitleScreen from "./game/TitleScreen.js";
import Board from "./game/Board.js";
import PlacingUnitsOverlay from "./game/PlacingUnitsOverlay.js";

const store = makeStore(
  {
    gameState: "STARTING",
    startedState: "PLACING_UNITS",
    maxUnits: 30,
    units: [],
    level: {
      cellSize: 16,
      rows: 41,
      cols: 41,
    },
    teams: [
      {
        teamID: "player",
        color: "#3e63dd",
      },
      {
        teamID: "CPU",
        color: "#e54d2e",
      },
    ],
  },
  (state, action, payload) => {
    const reducers = {
      STARTING: startingHandler,
      STARTED: startedHandler,
    };

    return reducers[state.gameState](state, action, payload) || state;
  }
);

let frameCounter = 1;
const gameLoop = new GameLoop((delta, frame) => {
  if (frame === 1) {
    store.dispatch({ type: "TICK_START" });
  }

  store.dispatch({ type: "TICK_PROGRESS", payload: { frame: frameCounter } });

  frameCounter += 1;

  if (frame % 60 === 0) {
    store.dispatch({ type: "TICK_END" });
    frameCounter = 0;
    store.dispatch({ type: "TICK_START" });
  }
});

const render = (state) => {
  if (state.gameState === "STARTING") {
    TitleScreen({
      startGame: () => {
        store.dispatch(startGame());
        gameLoop.start();
      },
    });
  } else {
    TitleScreen.remove();
  }

  if (state.gameState === "STARTED") {
    if (state.startedState === "PLACING_UNITS") {
      PlacingUnitsOverlay({
        maxUnits: state.maxUnits,
        unitsPlaced: state.units.length,
        onDone: () => store.dispatch(startBattle()),
      });
    } else {
      PlacingUnitsOverlay.remove();
    }

    Board({
      level: state.level,
      units: state.units,
      teams: state.teams,
      onClick: (row, col) => {
        store.dispatch(addUnit("player", [row, col], "HOLD"));
      },
    });
    return;
  }
};

store.onChange((state) => {
  render(state);
});

render(store.state);
