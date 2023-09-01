let isInitialized = false;
let onCommandFn = null;
function SelectedUnit({ unit, onCommand }) {
  onCommandFn = onCommand;
  if (!isInitialized) {
    const selectedUnitEl = document.createElement("div");
    selectedUnitEl.id = "selected-unit";
    selectedUnitEl.classList.add("command-bar");
    selectedUnitEl.innerHTML = `
      <div id="selected-unit-info" style="display: none">
        <div id="selected-unit-info-hp"></div>
        <div id="selected-unit-info-command"></div>
        <div id="selected-unit-info-state"></div>
      </div>
      <div id="selected-unit-actions" style="display: none">
        <button data-command="ATTACK_UP">Attack Up</button>
        <button data-command="ATTACK_DOWN">Attack Down</button>
        <button data-command="ATTACK_LEFT">Attack Left</button>
        <button data-command="ATTACK_RIGHT">Attack Right</button>
        <button data-command="HOLD">Hold</button>
      </div>
      <div id="selected-unit-message">Select one of your units.</div>
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

  const selectedUnitInfoEl = document.querySelector("#selected-unit-info");
  const selectedUnitActionsEl = document.querySelector(
    "#selected-unit-actions"
  );
  const selectedUnitMessageEl = document.querySelector(
    "#selected-unit-message"
  );
  if (unit) {
    selectedUnitInfoEl.style.display = "block";
    selectedUnitActionsEl.style.display = "block";
    selectedUnitMessageEl.style.display = "none";
    const selectedUnitInfoHP = document.querySelector("#selected-unit-info-hp");
    selectedUnitInfoHP.textContent = `HP: ${unit.hp}`;

    const commandEl = document.querySelector("#selected-unit-info-command");
    commandEl.textContent = `Command: ${unit.command}`;

    const stateEl = document.querySelector("#selected-unit-info-state");
    stateEl.textContent = `State: ${unit.unitState}`;
  } else {
    selectedUnitInfoEl.style.display = "none";
    selectedUnitActionsEl.style.display = "none";
    selectedUnitMessageEl.style.display = "block";
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
