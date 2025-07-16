import * as THREE from "three";

export default class Crosshair {
  constructor(game) {
    this.game = game;
    this.input = this.game.input;

    this.size = { normal: 30, shooting: 40 };
    this.dimensions = new THREE.Vector2(this.size.normal, this.size.normal);
    this.targetDimensions = this.dimensions.clone();
    this.pos = new THREE.Vector2(
      window.innerWidth * 0.5 - this.dimensions.x,
      window.innerHeight * 0.5 - this.dimensions.y
    );

    this.image = new Image();
    this.image.src = "/other/crosshair.png";

    this.hitMarker = new Image();
    this.hitMarker.src = "/other/hit-marker.png";
    this.hitMarkerOpacity = {
      current: 0,
      target: 0,
    };

    this.progressWidth = 0;
    this.reloadBarWidth = 250;
    this.reloadBarHeight = 10;
    this.reloadContainer = document.getElementById("reload-container");
    this.reloadBar = document.createElement("div");
    this.reloadBarProgress = document.createElement("div");
    this.reloadDiv = document.createElement("div");
    this.reloadSecs = document.createElement("div");

    this.reloadSpins = 1.5;
    this.spinAngle = 360;
    this.reloadTime = {
      elapsed: 0,
    };

    this.hidden = false;
    this.audio = this.createAudio();

    this.init();
  }
  createAudio() {
    const hitmarker = () => {
      const hitmarkerBuffer = this.game.audioCache.get("hitmarker");
      const hitmarkerSound = new THREE.Audio(this.game.listener);

      hitmarkerSound.setBuffer(hitmarkerBuffer);
      hitmarkerSound.setVolume(0.25);

      hitmarkerSound.play();
    };

    return { hitmarker };
  }
  init() {
    this.image.width = this.dimensions.x;
    this.image.classList.add("crosshair");

    this.hitMarker.width = this.dimensions.x;
    this.hitMarker.classList.add("hit-marker");

    this.reloadBar.style.width = `${this.reloadBarWidth}px`;
    this.reloadBar.style.height = `${this.reloadBarHeight}px`;
    this.reloadBar.classList.add("reload-bar");

    this.reloadBarProgress.classList.add("reload-bar-progress");
    this.updateReloadBar();

    this.reloadBar.appendChild(this.reloadBarProgress);
    this.reloadDiv.classList.add("reload-div");

    this.reloadSecs.classList.add("reload-secs");

    document.body.appendChild(this.image);
    document.body.appendChild(this.hitMarker);

    document.body.appendChild(this.reloadDiv);
    this.reloadContainer.appendChild(this.reloadBar);
    this.reloadContainer.appendChild(this.reloadSecs);
  }
  shoot() {
    this.targetDimensions.set(this.size.shooting, this.size.shooting);
    setTimeout(() => {
      this.targetDimensions.set(this.size.normal, this.size.normal);
    }, 175);
  }
  enableHitMarker() {
    this.audio.hitmarker();

    this.hitMarkerOpacity.target = 0.5;

    setTimeout(() => {
      this.hitMarkerOpacity.target = 0;
    }, 350);
  }
  updateHitMarker() {
    this.hitMarkerOpacity.current = THREE.MathUtils.lerp(
      this.hitMarkerOpacity.current,
      this.hitMarkerOpacity.target,
      0.15
    );

    this.hitMarker.style.opacity = this.hitMarkerOpacity.current;
  }
  updatePosition() {
    this.pos.x = this.input.mouse.crossHairPos.x - this.dimensions.x * 0.5;
    this.pos.y = this.input.mouse.crossHairPos.y - this.dimensions.y * 0.5;

    this.image.style.left = `${this.pos.x}px`;
    this.image.style.top = `${this.pos.y}px`;

    this.hitMarker.style.left = `${this.pos.x}px`;
    this.hitMarker.style.top = `${this.pos.y}px`;
  }
  updateSize() {
    this.dimensions.set(
      THREE.MathUtils.lerp(this.dimensions.x, this.targetDimensions.x, 0.1),
      THREE.MathUtils.lerp(this.dimensions.y, this.targetDimensions.y, 0.1)
    );

    this.image.width = this.dimensions.x;
  }
  reload() {
    if (!this.game.player.reloading) {
      this.reloadTime.elapsed = 0;
      return;
    }

    this.reloadTime.elapsed += this.game.delta;

    const progress = THREE.MathUtils.clamp(
      this.reloadTime.elapsed / this.game.player.reloadDuration,
      0,
      1
    );
    const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);
    const angle = easedProgress * this.spinAngle * this.reloadSpins;
    this.progressWidth = progress * 100;

    const timeLeft =
      Math.max(0, this.game.player.reloadDuration - this.reloadTime.elapsed) /
      1000;
    this.reloadSecs.textContent = `${timeLeft.toFixed(1)}s`;

    this.image.style.transform = `rotate(${angle}deg)`;
  }
  updateReloadBar() {
    this.reloadBarProgress.style.width = `${this.progressWidth}%`;

    const progressInPixels = (this.progressWidth / 100) * this.reloadBarWidth;

    this.reloadDiv.style.left = `calc(50% + ${
      progressInPixels - this.reloadBarWidth * 0.5
    }px)`;

    if (this.game.player.reloading) {
      this.reloadContainer.style.opacity = 0.75;
      this.reloadDiv.style.opacity = 1;
    } else {
      this.reloadContainer.style.opacity = 0;
      this.reloadDiv.style.opacity = 0;
    }
  }
  update() {
    if (this.hidden) return;

    this.updatePosition();
    this.updateSize();
    this.reload();
    this.updateReloadBar();
    this.updateHitMarker();
  }
  setHidden(hidden) {
    this.hidden = hidden;

    const display = hidden ? "none" : "block";

    this.image.style.display = display;
    this.hitMarker.style.display = display;
    this.reloadBar.style.display = display;
    this.reloadDiv.style.display = display;
    this.reloadSecs.style.display = display;
  }
}
