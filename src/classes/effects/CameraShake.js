import * as THREE from "three";

export default class CameraShake {
  constructor(game) {
    this.game = game;
    this.camera = this.game.camera;

    this.originalPosition = new THREE.Vector3().copy(this.camera.position);

    this.isShaking = false;
    this.shakeOffset = new THREE.Vector3();

    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }
  shake(intensity = 0.1, duration = 500) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
    this.isShaking = true;
  }
  update() {
    if (!this.isShaking) {
      this.camera.position.copy(this.originalPosition);
      return;
    }

    this.shakeTimer -= this.game.delta;

    if (this.shakeTimer <= 0) {
      this.isShaking = false;
      this.shakeIntensity = 0;
      this.shakeOffset.set(0, 0, 0);
      this.camera.position.copy(this.originalPosition);
      return;
    }

    const progress = this.shakeTimer / this.shakeDuration;
    const currentIntensity = this.shakeIntensity * progress;

    this.shakeOffset.set(
      (Math.random() - 0.5) * currentIntensity,
      (Math.random() - 0.5) * currentIntensity,
      (Math.random() - 0.5) * currentIntensity * 0.5
    );

    this.camera.position.copy(this.originalPosition).add(this.shakeOffset);
  }
  stop() {
    this.isShaking = false;
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this.shakeOffset.set(0, 0, 0);
    this.camera.position.copy(this.originalPosition);
  }
}
