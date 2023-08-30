let isInitialized = false;
let onCommandFn = null;
function SelectedUnit({ unit, onCommand }) {
  onCommandFn = onCommand;
  if (!isInitialized) {
    const selectedUnitEl = document.createElement("div");
    selectedUnitEl.id = "selected-unit";
    selectedUnitEl.innerHTML = `
      <div id="selected-unit-info">
        <div id="selected-unit-info-hp"></div>
        <div id="selected-unit-info-command"></div>
        <div id="selected-unit-info-state"></div>
      </div>
      <div id="selected-unit-actions">
        <button data-command="ATTACK_UP">Attack Up</button>
        <button data-command="ATTACK_DOWN">Attack Down</button>
        <button data-command="ATTACK_LEFT">Attack Left</button>
        <button data-command="ATTACK_RIGHT">Attack Right</button>
        <button data-command="HOLD">Hold</button>
      </div>
    `;

    const gameEl = document.querySelector("#game");
    gameEl.appendChild(selectedUnitEl);

    document.querySelectorAll("[data-command]").forEach((btn) => {
      btn.addEventListener("click", () => {
        onCommandFn(btn.dataset.command);
      });
    });

    isInitialized = true;
  }

  if (unit) {
    const selectedUnitInfoHP = document.querySelector("#selected-unit-info-hp");
    selectedUnitInfoHP.textContent = `HP: ${unit.hp}`;

    const commandEl = document.querySelector("#selected-unit-info-command");
    commandEl.textContent = `Command: ${unit.command}`;

    const stateEl = document.querySelector("#selected-unit-info-state");
    stateEl.textContent = `State: ${unit.unitState}`;
  }
}
SelectedUnit.remove = function () {
  if (isInitialized) {
    isInitialized = false;
    const selectedUnitEl = document.querySelector("#selected-unit");
    selectedUnitEl.remove();
  }
};
export default SelectedUnit;
