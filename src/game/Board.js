import { withinRange } from "./started.js";

let isInitialized = false;
let onClickFn = null;

function findTeam(teams, teamID) {
  const team = teams.find((t) => t.teamID === teamID);
  return team;
}

export default function Board({ state, onClick }) {
  const {
    level: { cellSize, rows, cols },
    teams,
    units,
    selectedUnitID,
  } = state;

  onClickFn = onClick;
  if (!isInitialized) {
    const canvasWidth = cellSize * cols;
    const canvasHeight = cellSize * rows;

    const boardEl = document.createElement("div");
    boardEl.id = "board";
    boardEl.innerHTML = `
      <canvas id="board-canvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>
    `;

    const gameEl = document.querySelector("#game");
    gameEl.appendChild(boardEl);

    const canvas = document.querySelector("#board-canvas");
    canvas.addEventListener("click", (e) => {
      const x = e.offsetX;
      const y = e.offsetY;
      const row = Math.floor(y / cellSize);
      const col = Math.floor(x / cellSize);
      onClickFn(row, col);
    });
    isInitialized = true;
  }

  const canvas = document.querySelector("#board-canvas");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw a grid with black border and white background
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  units.sort((a, b) => a.zIndex - b.zIndex);

  const selectedUnit = units.find((u) => u.unitID === selectedUnitID);

  units.forEach((u) => {
    const [row, col] = u.position;
    if (u.unitState === "DEAD") {
      ctx.fillStyle = "#8d8d8d";
    } else {
      ctx.fillStyle = findTeam(teams, u.teamID).color;
    }
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

    if (
      selectedUnitID &&
      (selectedUnitID === u.unitID || withinRange(selectedUnit, u))
    ) {
      ctx.strokeStyle = "#fbe32d";
      ctx.lineWidth = 1;
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  });

  units.forEach((u) => {
    const [row, col] = u.position;
    // draw a 2px health bar above the unit with a 1px black border and green fill
    ctx.strokeStyle = "black";
    ctx.strokeRect(col * cellSize + 2, row * cellSize + 2, cellSize - 5, 2);

    ctx.fillStyle = "#46a758";
    ctx.fillRect(
      col * cellSize + 2,
      row * cellSize + 2,
      (u.hp / 100) * (cellSize - 5),
      2
    );
  });
}
