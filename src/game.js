import GameLoop from "./game/GameLoop.js";
import { makeStore } from "./game/store.js";
import { startingHandler, startGame } from "./game/starting.js";
import {
  startedHandler,
  addUnit,
  startBattle,
  selectUnit,
  updateUnitCommand,
  updateCamera,
  cameraZoom,
} from "./game/started.js";
import TitleScreen from "./game/TitleScreen.js";
import Board from "./game/Board.js";
import PlacingUnitsOverlay from "./game/PlacingUnitsOverlay.js";
import SelectedUnit from "./game/SelectedUnit.js";

const level = {
  cellSize: 16,
  rows: 30,
  cols: 30,
};
const camera = {
  zoom: {
    level: 1,
    factor: 0.25,
  },
  offsetX: 0,
  offsetY: 0,
};

const store = makeStore(
  {
    gameState: "STARTING",
    startedState: "PLACING_UNITS",
    maxUnits: 30,
    units: [],
    selectedUnitID: null,
    level,
    teams: [
      {
        teamID: "PLAYER",
        color: "#3e63dd",
      },
      {
        teamID: "CPU",
        color: "#e54d2e",
      },
    ],
    camera,
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
    // store.dispatch({ type: "TICK_START" });
  }

  // store.dispatch({ type: "TICK_PROGRESS", payload: { frame: frameCounter } });

  frameCounter += 1;

  if (frame % 60 === 0) {
    // console.log("TICK");
    // store.dispatch({ type: "TICK_END" });
    frameCounter = 0;
    // store.dispatch({ type: "TICK_START" });
  }
});

let gameInterval;
const start = () => {
  store.dispatch({ type: "TICK_START" });
  gameInterval = setInterval(() => {
    store.dispatch({ type: "TICK_END" });
    frameCounter = 0;
    store.dispatch({ type: "TICK_START" });
  }, 1000);
};
const stop = () => {
  clearInterval(gameInterval);
};

const render = (state) => {
  if (state.gameState === "STARTING") {
    TitleScreen({
      startGame: () => {
        store.dispatch(startGame());
        gameLoop.start();
        start();
      },
    });
  } else {
    TitleScreen.remove();
  }

  if (state.gameState === "STARTED") {
    Board({
      state,
      onClick: ({ row, col }) => {
        if (state.startedState === "BATTLING") {
          store.dispatch(selectUnit({ row, col }));
          return;
        }

        store.dispatch(
          addUnit({
            teamID: "PLAYER",
            command: "HOLD",
            position: { row, col },
          })
        );
      },
      onUpdateCamera: (camera) => {
        store.dispatch(updateCamera(camera));
      },
      onCameraZoom: (zoom) => {
        store.dispatch(cameraZoom(zoom));
      },
    });

    if (state.startedState === "PLACING_UNITS") {
      PlacingUnitsOverlay({
        maxUnits: state.maxUnits,
        unitsPlaced: state.units.length,
        onDone: () => store.dispatch(startBattle()),
      });
    } else {
      PlacingUnitsOverlay.remove();
    }

    let selectedUnit;
    if (state.selectedUnitID) {
      selectedUnit = state.units.find((u) => u.unitID === state.selectedUnitID);
    }

    if (state.startedState === "BATTLING") {
      SelectedUnit({
        unit: selectedUnit,
        units: state.units,
        onCommand: (command) => {
          store.dispatch(updateUnitCommand(command));
        },
      });
    } else {
      SelectedUnit.remove();
    }

    return;
  }
};

store.onChange((state) => {
  render(state);
});

render(store.state);
