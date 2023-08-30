export const withinRange = (selectedUnit, unit) => {
  if (selectedUnit.teamID !== unit.teamID || unit.unitState === "DEAD") {
    return false;
  }

  return (
    (selectedUnit.position.row === unit.position.row &&
      selectedUnit.position.col === unit.position.col + 1) ||
    (selectedUnit.position.row === unit.position.row &&
      selectedUnit.position.col === unit.position.col - 1) ||
    (selectedUnit.position.col === unit.position.col &&
      selectedUnit.position.row === unit.position.row + 1) ||
    (selectedUnit.position.col === unit.position.col &&
      selectedUnit.position.row === unit.position.row - 1) ||
    (selectedUnit.position.row === unit.position.row + 1 &&
      selectedUnit.position.col === unit.position.col + 1) ||
    (selectedUnit.position.row === unit.position.row + 1 &&
      selectedUnit.position.col === unit.position.col - 1) ||
    (selectedUnit.position.row === unit.position.row - 1 &&
      selectedUnit.position.col === unit.position.col + 1) ||
    (selectedUnit.position.row === unit.position.row - 1 &&
      selectedUnit.position.col === unit.position.col - 1)
  );
};

function direction(x, y, x1, y1) {
  if (x === x1) {
    if (y > y1) {
      return "UP";
    } else {
      return "DOWN";
    }
  } else if (y === y1) {
    if (x > x1) {
      return "LEFT";
    } else {
      return "RIGHT";
    }
  }
}

function battle(units, unit) {
  const unitEnemyTargets = units.filter(
    (u) => u.unitID === unit.enemyTarget.unitID && u.unitState !== "DEAD"
  );

  if (unitEnemyTargets.length === 0) {
    return {
      ...unit,
      unitState: "IDLE",
      lastBattle: null,
      enemyTarget: null,
    };
  }

  const battle = unitEnemyTargets.reduce(
    (acc, u) => {
      const critted = Math.random() < 0.1;
      const blocked = Math.random() < 0.1;
      const missed = Math.random() < 0.1;
      if (missed) {
        return {
          ...acc,
          misses: acc.misses + 1,
        };
      }
      if (blocked && !critted) {
        return {
          ...acc,
          blocks: acc.blocks + 1,
          dmg: acc.dmg + u.dmg / 2,
        };
      }
      if (critted && !blocked) {
        return {
          ...acc,
          crits: acc.crits + 1,
          dmg: acc.dmg + u.dmg * 2,
        };
      }

      return {
        ...acc,
        hits: acc.hits + 1,
        dmg: acc.dmg + u.dmg,
      };
    },
    {
      misses: 0,
      crits: 0,
      blocks: 0,
      hits: 0,
      dmg: 0,
    }
  );

  const hp = Math.max(unit.hp - battle.dmg, 0);

  const direction = unit.unitState.split("_")[1];

  return {
    ...unit,
    hp,
    unitState: hp === 0 ? "DEAD" : `ATTACKING_${direction}`,
    lastBattle: battle,
    zIndex: hp === 0 ? 0 : 10,
  };
}

function target(enemiesWithinRange, unit) {
  const enemy = enemiesWithinRange[0];

  const dir = direction(
    unit.position.row,
    unit.position.col,
    enemy.position.row,
    enemy.position.col
  );

  return {
    ...unit,
    unitState: `ATTACKING_${dir}`,
    enemyTarget: { unitID: enemy.unitID },
  };
}

const getNextPosition = ({ direction, position: { col, row } }) => {
  switch (direction) {
    case "UP":
      return { row: row - 1, col };
    case "DOWN":
      return { row: row + 1, col };
    case "LEFT":
      return { row, col: col - 1 };
    case "RIGHT":
      return { row, col: col + 1 };
  }
};

export const enemiesWithinRange = ({ units, unit }) => {
  return units.filter((u) => {
    if (u.teamID === unit.teamID || u.unitState === "DEAD") {
      return false;
    }

    const { row: unitRow, col: unitCol } = unit.position;
    const { row, col } = u.position;

    return (
      (unitRow === row && unitCol === col + 1) ||
      (unitRow === row && unitCol === col - 1) ||
      (unitCol === col && unitRow === row + 1) ||
      (unitCol === col && unitRow === row - 1)
    );
  });
};

function positionKey(position) {
  return `${position.row},${position.col}`;
}

export function tick(state) {
  const predictedPositions = [];
  const newUnits = [...state.units];
  const placements = new Map();

  newUnits.forEach((unit) => {
    let nextPosition = null;
    const willMove = () => {
      if (unit.command.startsWith("ATTACK")) {
        // predict movement
        const direction = unit.command.split("_")[1];
        nextPosition = getNextPosition({
          direction,
          position: unit.position,
        });
        if (
          nextPosition.row >= 0 &&
          nextPosition.row < state.level.rows &&
          nextPosition.col >= 0 &&
          nextPosition.col < state.level.cols
        ) {
          return true;
        }
      }

      return false;
    };

    if (unit.unitState !== "DEAD") {
      if (willMove()) {
        predictedPositions.push({
          unitID: unit.unitID,
          nextPosition,
          prevPosition: unit.position,
        });
      } else {
        // place static units
        predictedPositions.push({
          unitID: unit.unitID,
          nextPosition: unit.position,
          prevPosition: unit.position,
        });
      }
      placements.set(positionKey(unit.position), unit.unitID);
    }
  });

  const buildTrees = () => {
    const nodes = newUnits
      .filter((u) => u.unitState !== "DEAD")
      .map((unit) => ({
        unitID: unit.unitID,
        children: [],
      }));
    const rootNodes = [];
    nodes.forEach((node) => {
      const predictedPosition = predictedPositions.find(
        (p) => p.unitID === node.unitID
      );
      const targetUnitID = predictedPositions.find(
        (p) =>
          p.unitID !== node.unitID &&
          p.prevPosition.row === predictedPosition.nextPosition.row &&
          p.prevPosition.col === predictedPosition.nextPosition.col
      );
      if (targetUnitID) {
        const targetNode = nodes.find((n) => n.unitID === targetUnitID.unitID);
        targetNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const trees = buildTrees({ state, predictedPositions });

  const processTrees = (trees) => {
    trees.forEach((tree) => {
      const { nextPosition, prevPosition } = predictedPositions.find(
        (p) => p.unitID === tree.unitID
      );
      const cellIsEmpty = !placements.has(positionKey(nextPosition));
      if (cellIsEmpty) {
        placements.set(positionKey(nextPosition), tree.unitID);
        placements.delete(positionKey(prevPosition));

        const unitIdx = newUnits.findIndex((u) => u.unitID === tree.unitID);
        newUnits.splice(unitIdx, 1, {
          ...newUnits[unitIdx],
          position: nextPosition,
        });
        processTrees(tree.children);
      }
    });
  };

  processTrees(trees);

  return {
    ...state,
    units: newUnits,
  };
}

function tickOld(state) {
  const nunits = state.units.map((unit) => {
    if (unit.unitState === "DEAD") {
      return unit;
    }

    if (unit.unitState.startsWith("ATTACKING")) {
      return battle(state.units, unit);
    }

    const enemiesWithinRange = state.units.filter((u) => {
      if (u.teamID === unit.teamID || u.unitState === "DEAD") {
        return false;
      }

      const { row: unitRow, col: unitCol } = unit.position;
      const { row, col } = u.position;

      return (
        (unitRow === row && unitCol === col + 1) ||
        (unitRow === row && unitCol === col - 1) ||
        (unitCol === col && unitRow === row + 1) ||
        (unitCol === col && unitRow === row - 1)
      );
    });

    // if there is an enemy in range target it
    if (enemiesWithinRange.length > 0) {
      return target(enemiesWithinRange, unit);
    }

    if (unit.command === "HOLD") {
      return {
        ...unit,
        unitState: "IDLE",
      };
    }

    return {
      ...unit,
      unitState: `MOVING_${unit.command.split("_")[1]}`,
    };
  });

  const predictedPositions = [];
  nunits.forEach((unit) => {
    if (!unit.unitState.startsWith("MOVING")) {
      return;
    }
    const { row, col } = unit.position;
    const direction = unit.unitState.split("_")[1];
    const nextPosition = getNextPosition({ direction, col, row });
    console.log({ unitID: unit.unitID, nextPosition });
    predictedPositions.push({
      unitID: unit.unitID,
      nextPosition,
    });
  });

  predictedPositions.forEach((prediction) => {
    let collidesWith = null;

    predictedPositions.forEach((otherPrediction) => {
      if (prediction.unitID === otherPrediction.unitID) {
        return;
      }

      if (
        prediction.nextPosition.row === otherPrediction.nextPosition.row &&
        prediction.nextPosition.col === otherPrediction.nextPosition.col
      ) {
        collidesWith = otherPrediction;
      }
    });

    if (collidesWith && prediction.unitID < collidesWith.unitID) {
      console.log("collides with", collidesWith);
      return;
    } else {
      collidesWith = null;
      nunits.forEach((unit) => {
        if (unit.unitID === prediction.unitID || unit.unitState === "DEAD") {
          return;
        }

        if (
          prediction.nextPosition.row === unit.position.row &&
          prediction.nextPosition.col === unit.position.col
        ) {
          collidesWith = unit;
        }
      });

      console.log("collides with--", collidesWith);
      if (!collidesWith) {
        nunits.splice(
          nunits.findIndex((u) => u.unitID === prediction.unitID),
          1,
          {
            ...nunits.find((u) => u.unitID === prediction.unitID),
            position: [
              prediction.nextPosition.row,
              prediction.nextPosition.col,
            ],
          }
        );
      }
    }
  });

  return nunits;
}

function canPlaceUnit(state, position) {
  const {
    units,
    level: { rows },
    maxUnits,
  } = state;

  // only teamID of player can place units, and only on the bottom half of the board
  if (position.row < rows / 2) {
    console.debug("cannot place unit on top half of board");
    return false;
  }

  if (units.length >= maxUnits) {
    console.debug("cannot place unit, max units reached");
    return false;
  }

  const isCellEmpty =
    units.find(
      (u) => u.position.row === position.row && u.position.col === position.col
    ) === undefined;
  if (isCellEmpty === false) {
    console.debug("cannot place unit, unit already at position");
    return false;
  }

  return true;
}

export const addUnit = ({ teamID, position, command }) => ({
  type: "ADD_UNIT",
  payload: {
    teamID,
    position,
    command,
  },
});

export const selectUnit = ({ col, row }) => ({
  type: "SELECT_UNIT",
  payload: {
    col,
    row,
  },
});

export const startBattle = () => ({
  type: "START_BATTLE",
});

// TODO: Rename this, it is technically updating all of the selected units commands
export const updateUnitCommand = (command) => ({
  type: "UPDATE_UNIT_COMMAND",
  payload: {
    command,
  },
});

export const updateCamera = (camera) => ({
  type: "UPDATE_CAMERA",
  payload: {
    camera,
  },
});

export const cameraZoom = ({ deltaY, mouseX, mouseY }) => ({
  type: "CAMERA_ZOOM",
  payload: {
    deltaY,
    mouseX,
    mouseY,
  },
});

export const startedHandler = (state, action) => {
  if (action.type === "CAMERA_ZOOM") {
    const { deltaY, mouseX, mouseY } = action.payload;

    const delta = Math.sign(deltaY) * -1;
    const tentativeZoomLevel =
      state.camera.zoom.level + delta * state.camera.zoom.factor;
    const zoomLevel = Math.min(Math.max(tentativeZoomLevel, 1), 4);

    const offsetX =
      mouseX + state.camera.offsetX * (1 - zoomLevel / state.camera.zoom.level);
    const offsetY =
      mouseY + state.camera.offsetY * (1 - zoomLevel / state.camera.zoom.level);

    console.log({ mouseX, mouseY, offsetX, offsetY, zoomLevel });

    return {
      ...state,
      camera: {
        ...state.camera,
        offsetX,
        offsetY,
        zoom: {
          ...state.camera.zoom,
          level: zoomLevel,
        },
      },
    };
  } else if (action.type === "UPDATE_CAMERA") {
    const {
      camera: { movement, zoomDirection },
    } = action.payload;

    let offsetX = state.camera.offsetX;
    let offsetY = state.camera.offsetY;

    let zoomLevel = state.camera.zoom.level;
    if (zoomDirection === "IN") {
      zoomLevel = Math.min(4, zoomLevel + 1);
    } else if (zoomDirection === "OUT") {
      zoomLevel = Math.max(1, zoomLevel - 1);
    }

    if (movement) {
      offsetX = state.camera.offsetX + movement.x;
      offsetY = state.camera.offsetY + movement.y;
    }

    return {
      ...state,
      camera: {
        ...state.camera,
        zoom: {
          ...state.camera.zoom,
          level: zoomLevel,
        },
        offsetX,
        offsetY,
      },
    };
  } else if (action.type === "UPDATE_UNIT_COMMAND") {
    const { command } = action.payload;

    const selectedUnit = state.units.find(
      (u) => u.unitID === state.selectedUnitID
    );

    return {
      ...state,
      units: state.units.map((u) => {
        if (state.selectedUnitID === u.unitID || withinRange(selectedUnit, u)) {
          return {
            ...u,
            command,
          };
        }

        return u;
      }),
    };
  } else if (action.type === "SELECT_UNIT") {
    const { col, row } = action.payload;

    const selectedUnit = state.units.find(
      (u) =>
        u.position.row === row &&
        u.position.col === col &&
        u.teamID === "PLAYER"
    );

    return {
      ...state,
      selectedUnitID: selectedUnit?.unitID || null,
    };
  } else if (action.type === "START_BATTLE") {
    // add units based on state.maxUnits to the CPU team in the top half of the board
    // at random but grid aligned positions
    const cpuUnits = [];
    for (let i = 0; i < state.maxUnits; i++) {
      const unitID = Math.random().toString(36).substr(2, 9);
      const position = {
        row: Math.floor((Math.random() * state.level.rows) / 2),
        col: Math.floor(Math.random() * state.level.cols),
      };
      // cpuUnits.push({
      //   teamID: "CPU",
      //   unitID,
      //   position,
      //   command: "ATTACK_DOWN",
      //   unitState: "IDLE",
      //   hp: 100,
      //   dmg: 10,
      //   enemyTarget: null,
      //   lastBattle: null,
      //   zIndex: 10,
      // });
    }

    return {
      ...state,
      startedState: "BATTLING",
      units: [...state.units, ...cpuUnits],
    };
  } else if (action.type === "TICK_START") {
    console.log("tick start");
    return state;
  } else if (action.type === "TICK_PROGRESS") {
    const { frame } = action.payload;
    // console.log(`tick progress ${frame}`);
    return state;
  } else if (action.type === "TICK_END") {
    console.log("tick end");
    return tick(state);
  } else if (action.type === "ADD_UNIT") {
    const { teamID, position, command } = action.payload;

    if (!canPlaceUnit(state, position, teamID)) {
      return state;
    }

    const unitID = Math.random().toString(36).substr(2, 9);
    const unit = {
      teamID,
      unitID,
      position,
      hp: 100,
      dmg: 10,
      command,
      unitState: "IDLE",
      enemyTarget: null,
      lastBattle: null,
      zIndex: 10,
    };

    return {
      ...state,
      units: [...state.units, unit],
    };
  }

  return state;
};
