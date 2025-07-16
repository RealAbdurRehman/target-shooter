export default class HUD {
  constructor(game) {
    this.game = game;
    this.player = this.game.player;

    this.elements = {
      ammo: {
        container: document.querySelector(".ammo-display"),
        current: document.getElementById("ammo-current"),
        remaining: document.getElementById("ammo-remaining"),
      },
      health: {
        container: document.querySelector(".health-display"),
        display: document.getElementById("health"),
      },
      score: {
        container: document.querySelector(".score-display"),
        display: document.getElementById("score"),
      },
      vignette: null,
    };

    this.init();
  }
  init() {
    this.createVignette();
  }
  createVignette() {
    this.elements.vignette = new Image();
    this.elements.vignette.src = "/other/vignette.png";
    this.elements.vignette.classList.add("vignette");
    document.body.appendChild(this.elements.vignette);
  }
  updateAmmo() {
    this.elements.ammo.current.innerText = `${this.player.ammo.current}`;
    this.elements.ammo.remaining.innerText = `${this.player.ammo.total}`;
  }
  updateHealth() {
    const health = this.player.health.current;
    const max = this.player.health.max;

    this.elements.health.display.innerText = `${health}`;

    const circle = document.querySelector(".health-circle .fg");
    const circumference = 2 * Math.PI * 30;
    const offset = circumference * (1 - health / max);

    circle.style.strokeDashoffset = offset;
  }
  updateScore() {
    this.elements.score.display.innerText = `${this.player.score.current}`;
  }
  updateVignette() {
    this.elements.vignette.style.opacity = this.player.isZoomed ? 1 : 0;
  }
  update() {
    if (this.game.isPaused) return;

    this.updateAmmo();
    this.updateHealth();
    this.updateScore();
    this.updateVignette();
  }
  hide() {
    this.elements.ammo.container.style.opacity = 0;
    this.elements.health.container.style.opacity = 0;
    this.elements.score.container.style.opacity = 0;
  }
  show() {
    this.elements.ammo.container.style.opacity = 1;
    this.elements.health.container.style.opacity = 1;
    this.elements.score.container.style.opacity = 1;
  }
}
