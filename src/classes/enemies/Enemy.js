import Shootable from "../Shootable.js";

export default class Enemy extends Shootable {
  constructor({
    game,
    position,
    model,
    scale,
    movementPattern = "sideways",
    offset,
    spawnAnimationDuration,
    disappearAnimationDuration,
  }) {
    super({
      game,
      position,
      model,
      scale,
      offset,
      spawnAnimationDuration,
      disappearAnimationDuration,
    });
    this.movementPattern = movementPattern;

    this.isEnemy = true;

    this.originalPosition = position.clone();
    this.movementTime = 0;

    this.movementSpeed = 1;
    this.movementAmplitude = 1;
    this.movementFrequency = 1;

    this.body = this.createBody();
  }
  updateMovement() {
    if (this.disappearing || this.movementPattern === "static") return;

    const movementSettings = this.game.difficultyManager.getMovementSettings();
    this.movementSpeed = movementSettings.speed;
    this.movementAmplitude = movementSettings.amplitude;
    this.movementFrequency = movementSettings.frequency;

    this.movementTime += this.game.delta * 0.001 * this.movementSpeed;

    let newPosition = this.originalPosition.clone();

    switch (this.movementPattern) {
      case "sideways":
        newPosition.x +=
          Math.sin(this.movementTime * this.movementFrequency) *
          this.movementAmplitude;
        break;
      case "vertical":
        newPosition.y +=
          Math.sin(this.movementTime * this.movementFrequency) *
          this.movementAmplitude;
        break;
      case "circular":
        newPosition.x +=
          Math.sin(this.movementTime * this.movementFrequency) *
          this.movementAmplitude;
        newPosition.y +=
          Math.cos(this.movementTime * this.movementFrequency) *
          this.movementAmplitude;
        break;
      case "zigzag":
        newPosition.x +=
          Math.sin(this.movementTime * this.movementFrequency) *
          this.movementAmplitude;
        newPosition.y +=
          Math.sin(this.movementTime * this.movementFrequency * 2) *
          this.movementAmplitude *
          0.5;
        break;
      case "pendulum":
        const pendulumAngle =
          Math.sin(this.movementTime * this.movementFrequency) * Math.PI * 0.5;
        newPosition.x += Math.sin(pendulumAngle) * this.movementAmplitude;
        newPosition.y += Math.cos(pendulumAngle) * this.movementAmplitude * 0.5;
        break;
      case "orbit":
        const orbitSpeed = this.movementFrequency * 0.7;
        const orbitRadius = this.movementAmplitude * 1.2;
        newPosition.x += Math.sin(this.movementTime * orbitSpeed) * orbitRadius;
        newPosition.y +=
          Math.cos(this.movementTime * orbitSpeed * 1.3) * orbitRadius * 0.6;
        newPosition.z +=
          Math.sin(this.movementTime * orbitSpeed * 0.8) * orbitRadius * 0.3;
        break;
      case "wave":
        newPosition.x +=
          Math.sin(this.movementTime * this.movementFrequency) *
          this.movementAmplitude;
        newPosition.y +=
          Math.sin(
            this.movementTime * this.movementFrequency * 0.7 + Math.PI * 0.25
          ) *
          this.movementAmplitude *
          0.6;
        newPosition.z +=
          Math.sin(this.movementTime * this.movementFrequency * 0.5) *
          this.movementAmplitude *
          0.3;
        break;
      case "butterfly":
        const butterflyT = this.movementTime * this.movementFrequency;
        const butterflyScale = this.movementAmplitude;
        newPosition.x +=
          Math.sin(butterflyT) *
          (Math.exp(Math.cos(butterflyT)) - 2 * Math.cos(4 * butterflyT)) *
          butterflyScale *
          0.1;
        newPosition.y +=
          Math.cos(butterflyT) *
          (Math.exp(Math.cos(butterflyT)) - 2 * Math.cos(4 * butterflyT)) *
          butterflyScale *
          0.1;
        break;
    }

    this.body.position.set(newPosition.x, newPosition.y, newPosition.z);
  }
  update() {
    super.update();
    this.updateMovement();
  }
}
