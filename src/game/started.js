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
    unit.position[0],
    unit.position[1],
    enemy.position[0],
    enemy.position[1]
  );

  return {
    ...unit,
    unitState: `ATTACKING_${dir}`,
    enemyTarget: { unitID: enemy.unitID },
  };
}

function move({ units, level }, posLocks, unit) {
  const getNextPosition = (direction, row, col) => {
    switch (direction) {
      case "UP":
        return [row - 1, col];
      case "DOWN":
        return [row + 1, col];
      case "LEFT":
        return [row, col - 1];
      case "RIGHT":
        return [row, col + 1];
    }
  };

  const [row, col] = unit.position;
  const direction = unit.command.split("_")[1];
  const nextPosition = getNextPosition(direction, row, col);
  if (posLocks.has(nextPosition.join(","))) {
    // don't move
    return {
      ...unit,
      unitState: "IDLE",
    };
  }

  // don't move off the map
  if (
    nextPosition[0] < 0 ||
    nextPosition[0] >= level.rows ||
    nextPosition[1] < 0 ||
    nextPosition[1] >= level.cols
  ) {
    return {
      ...unit,
      unitState: "IDLE",
    };
  }

  posLocks.set(nextPosition.join(","), true);

  return {
    ...unit,
    unitState: `MOVING_${direction}`,
    position: nextPosition,
  };
}

function tick(state) {
  const { units } = state;
  let posLocks = new Map();

  units.forEach((unit) => {
    if (unit.unitState === "IDLE" || unit.unitState.startsWith("ATTACKING")) {
      posLocks.set(unit.position.join(","), true);
    }
  });

  return units.map((unit) => {
    if (unit.unitState === "DEAD") {
      return unit;
    }

    if (unit.unitState.startsWith("ATTACKING")) {
      return battle(units, unit);
    }

    const enemiesWithinRange = units.filter((u) => {
      if (u.teamID === unit.teamID || u.unitState === "DEAD") {
        return false;
      }

      const [unitRow, unitCol] = unit.position;
      const [row, col] = u.position;

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

    return move(state, posLocks, unit);
  });
}

function canPlaceUnit(state, position) {
  const {
    units,
    level: { rows },
    maxUnits,
  } = state;

  // only teamID of player can place units, and only on the bottom half of the board
  if (position[0] < rows / 2) {
    console.debug("cannot place unit on top half of board");
    return false;
  }

  if (units.length >= maxUnits) {
    console.debug("cannot place unit, max units reached");
    return false;
  }

  const unitAtPosition = units.find(
    (u) => u.position[0] === position[0] && u.position[1] === position[1]
  );

  if (unitAtPosition) {
    console.debug("cannot place unit, unit already at position");
    return false;
  }

  return true;
}

export const addUnit = (teamID, position, command) => ({
  type: "ADD_UNIT",
  payload: {
    teamID,
    position,
    command,
  },
});

export const startBattle = () => ({
  type: "START_BATTLE",
});

export const startedHandler = (state, action) => {
  if (action.type === "START_BATTLE") {
    // add units based on state.maxUnits to the CPU team in the top half of the board
    // at random but grid aligned positions
    const cpuUnits = [];
    for (let i = 0; i < state.maxUnits; i++) {
      const unitID = Math.random().toString(36).substr(2, 9);
      const position = [
        Math.floor((Math.random() * state.level.rows) / 2),
        Math.floor(Math.random() * state.level.cols),
      ];
      cpuUnits.push({
        teamID: "CPU",
        unitID,
        position,
        command: "ATTACK_DOWN",
        unitState: "IDLE",
        hp: 100,
        dmg: 10,
        enemyTarget: null,
        lastBattle: null,
        zIndex: 0,
      });
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
    return {
      ...state,
      units: tick(state),
    };
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
      zIndex: 0,
    };

    const units = [...state.units, unit];

    return {
      ...state,
      units,
    };
  }

  return state;
};
