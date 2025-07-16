export default class PauseScreen {
  constructor(game) {
    this.game = game;

    this.pauseScreen = document.getElementById("pause-screen");
    this.scoreEl = document.getElementById("pause-score");
    this.accuracyEl = document.getElementById("pause-accuracy");
    this.restartButton = document.getElementById("restart-pause");

    this.addListeners();
  }
  addListeners() {
    this.restartButton.addEventListener("click", () => {
      window.location.reload();
    });
  }
  show() {
    if (this.game.isLoading) return;

    this.updateStats();
    this.pauseScreen.classList.add("visible");
  }
  updateStats() {
    this.scoreEl.textContent = this.game.player.score.current;
    this.accuracyEl.textContent = `${this.game.player.getAccuracy()}%`;
  }
  hide() {
    this.pauseScreen.classList.remove("visible");
  }
  toggle() {
    if (this.game.isPaused) this.show();
    else this.hide();
  }
}
