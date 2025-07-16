import * as THREE from "three";

import AmmoDrop from "./AmmoDrop.js";
import HealthDrop from "./HealthDrop.js";

export default class DropManager {
  constructor(game) {
    this.game = game;

    this.drops = [];

    this.ammoDrop = { interval: 20000, timeToNew: 0, duration: 10000 };
    this.healthDrop = { interval: 30000, timeToNew: 0, duration: 10000 };
  }
  createDrop(drop) {
    this.drops.push(drop);
  }
  spawnAmmoDrops() {
    this.ammoDrop.timeToNew += this.game.delta;

    if (this.ammoDrop.timeToNew >= this.ammoDrop.interval) {
      this.createDrop(
        new AmmoDrop({ game: this.game, position: this.getAmmoPosition() })
      );

      this.ammoDrop.timeToNew -= this.ammoDrop.interval;
    }
  }
  spawnHealthDrops() {
    this.healthDrop.timeToNew += this.game.delta;

    if (this.healthDrop.timeToNew >= this.healthDrop.interval) {
      this.createDrop(
        new HealthDrop({ game: this.game, position: this.getHealthPosition() })
      );

      this.healthDrop.timeToNew -= this.healthDrop.interval;
    }
  }
  spawnDrops() {
    this.spawnAmmoDrops();
    this.spawnHealthDrops();
  }
  updateDrops() {
    for (const drop of this.drops) {
      drop.update();

      if (drop.elapsed >= this.ammoDrop.duration) drop.disappear();
      if (drop.elapsed >= this.healthDrop.duration) drop.disappear();

      if (drop.isMarkedForDeletion) drop.remove();
    }

    this.drops = this.drops.filter((d) => !d.isMarkedForDeletion);
  }
  update() {
    this.spawnDrops();
    this.updateDrops();
  }
  getAmmoPosition() {
    return new THREE.Vector3(2.5, -2, 3);
  }
  getHealthPosition() {
    return new THREE.Vector3(-2.5, -2, 3);
  }
}
