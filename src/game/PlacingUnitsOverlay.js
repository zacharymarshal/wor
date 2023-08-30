let isInitialized = false;
function PlacingUnitsOverlay({ maxUnits, unitsPlaced, onDone }) {
  if (!isInitialized) {
    const overlayEl = document.createElement("div");
    overlayEl.id = "placing-units-overlay";
    overlayEl.innerHTML = `
      <h1>Place your units</h1>
      <p>Units placed: <span id="placing-units-overlay-status"></span></p>
      <button id="done-button">Done</button>
    `;
    const doneBtn = overlayEl.querySelector("#done-button");
    doneBtn.addEventListener("click", () => {
      onDone();
    });
    const gameEl = document.querySelector("#game");
    gameEl.appendChild(overlayEl);
    isInitialized = true;
  }

  const statusEl = document.querySelector("#placing-units-overlay-status");
  statusEl.textContent = `${unitsPlaced}/${maxUnits}`;

  const doneBtn = document.querySelector("#done-button");
  if (maxUnits === unitsPlaced) {
    doneBtn.removeAttribute("disabled");
  } else {
    // doneBtn.setAttribute("disabled", "");
  }
}
PlacingUnitsOverlay.remove = function () {
  if (isInitialized) {
    isInitialized = false;
    const overlayEl = document.querySelector("#placing-units-overlay");
    overlayEl.remove();
  }
};
export default PlacingUnitsOverlay;
