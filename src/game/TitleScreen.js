function TitleScreen({ startGame }) {
  const gameEl = document.querySelector("#game");
  gameEl.innerHTML = `
    <div id="title-screen">
      <h1>wör</h1>
      <button id="start-button">Start</button>
    </div>
  `;
  const startBtn = document.querySelector("#start-button");
  startBtn.addEventListener("click", () => {
    startGame();
  });
}
TitleScreen.remove = function () {
  const titleScreenEl = document.querySelector("#title-screen");
  if (titleScreenEl) {
    titleScreenEl.remove();
  }
};
export default TitleScreen;
