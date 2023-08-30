import { withinRange } from "./started.js";

let isInitialized = false;
let onClickFn = null;
let onUpdateCameraFn = null;
let onCameraZoomFn = null;

function findTeam(teams, teamID) {
  const team = teams.find((t) => t.teamID === teamID);
  return team;
}

export default function Board({
  state,
  onClick,
  onUpdateCamera,
  onCameraZoom,
}) {
  const {
    level: { cellSize, rows, cols },
    teams,
    units,
    selectedUnitID,
  } = state;

  onClickFn = onClick;
  onUpdateCameraFn = onUpdateCamera;
  onCameraZoomFn = onCameraZoom;
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

    boardEl.addEventListener("wheel", (e) => {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      onCameraZoomFn({ deltaY: e.deltaY, mouseX, mouseY });
    });

    let isDragging = false;
    let clickStartX = null;
    let clickStartY = null;
    let lastX = null;
    let lastY = null;
    boardEl.addEventListener("pointerdown", (e) => {
      e.preventDefault();

      clickStartX = e.offsetX;
      clickStartY = e.offsetY;
      isDragging = false;

      const handleContextMenu = (e) => {
        e.preventDefault();
      };

      // Bug in iOS Safari movementX/Y: https://bugs.webkit.org/show_bug.cgi?id=248119
      lastX = e.clientX;
      lastY = e.clientY;

      const handleMouseMove = (e) => {
        const x = e.offsetX;
        const y = e.offsetY;
        if (clickStartX && clickStartY) {
          const deltaX = x - clickStartX;
          const deltaY = y - clickStartY;
          if (Math.abs(deltaX) > cellSize || Math.abs(deltaY) > cellSize) {
            isDragging = true;
          }
        }

        if (isDragging) {
          let movementX = e.movementX;
          let movementY = e.movementY;

          // Bug in iOS Safari movementX/Y: https://bugs.webkit.org/show_bug.cgi?id=248119
          if (movementX === undefined || movementY === undefined) {
            movementX = e.clientX - lastX;
            movementY = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
          }

          onUpdateCameraFn({
            movement: {
              x: movementX,
              y: movementY,
            },
          });
        }
      };

      const handleMouseUp = () => {
        if (!isDragging) {
          const row = Math.floor(clickStartY / cellSize);
          const col = Math.floor(clickStartX / cellSize);
          onClickFn({ row, col });
        }
        cleanup();
      };

      const handleMouseLeave = () => {
        cleanup();
      };

      const cleanup = () => {
        clickStartX = null;
        clickStartY = null;
        isDragging = false;
        boardEl.removeEventListener("pointermove", handleMouseMove);
        boardEl.removeEventListener("pointerup", handleMouseUp);
        boardEl.removeEventListener("contextmenu", handleContextMenu);
        boardEl.removeEventListener("pointerleave", handleMouseLeave);
      };

      boardEl.addEventListener("pointermove", handleMouseMove);
      boardEl.addEventListener("pointerup", handleMouseUp);
      boardEl.addEventListener("contextmenu", handleContextMenu);
      boardEl.addEventListener("pointerleave", handleMouseLeave);
    });

    isInitialized = true;
  }

  const canvas = document.querySelector("#board-canvas");

  // camera stuff
  const camera = state.camera;
  canvas.style.transform = `translate3d(${camera.offsetX}px, ${camera.offsetY}px, 0) scale(${camera.zoom.level})`;
  canvas.style.width = `${cellSize * cols}px`;
  canvas.style.height = `${cellSize * rows}px`;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw a grid with black border and white background
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      ctx.fillStyle = "#ffffff";
      if (state.startedState === "PLACING_UNITS") {
        ctx.fillStyle = row >= rows / 2 ? "#ffffff" : "#8d8d8d";
      }
      ctx.strokeStyle = "black";
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  units.sort((a, b) => a.zIndex - b.zIndex);

  const selectedUnit = units.find((u) => u.unitID === selectedUnitID);

  units.forEach((u) => {
    const { row, col } = u.position;
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
    const { row, col } = u.position;
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
