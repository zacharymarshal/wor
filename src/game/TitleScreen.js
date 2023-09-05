import "../zzfx.js";

let isInitialized = false;
function TitleScreen({ startGame }) {
  if (!isInitialized) {
    const gameEl = document.querySelector("#game");
    gameEl.innerHTML = `
      <div id="title-screen">
        <h1>wör</h1>
        <p></p>
        <button id="start-button">Start</button>
      </div>
    `;
    const startBtn = document.querySelector("#start-button");
    startBtn.addEventListener("click", () => {
      /* prettier-ignore */
      zzfxP(...zzfxM(...[[[,0,400,,.27,,1]],[[[,-1,16,19,21,14,11,9,11,14,16,16,14,16,19,16,14,16,16,14,16,19,19,19,16,,14,,9,11,9,7,7,7,9,11,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,1,,19,,16,16,,16,16,9,7,4,4,4,4,4,,,11,9,14,16,14,4,2,4,4,4,4,4,4,4,4,4,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]]],[0],55,{"title":"New Song","instruments":["Instrument 0"],"patterns":["Pattern 0"]}]));
      startGame();
    });
    isInitialized = true;
  }
}
TitleScreen.remove = function () {
  if (isInitialized) {
    isInitialized = false;
    const titleScreenEl = document.querySelector("#title-screen");
    titleScreenEl.remove();
  }
};
export default TitleScreen;
