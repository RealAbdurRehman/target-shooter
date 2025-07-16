import * as THREE from "three";

import Smoke from "./Smoke.js";

export default class SmokeManager {
  constructor(game) {
    this.game = game;

    this.smokes = [];
  }
  createSmoke({
    position = new THREE.Vector3(),
    smokeCount = 4,
    duration = 1.2,
    normal = new THREE.Vector3(0, 1, 0),
  }) {
    this.smokes.push(
      new Smoke({ game: this.game, position, smokeCount, duration, normal })
    );
  }
  update() {
    for (const smoke of this.smokes) smoke.update();

    this.smokes = this.smokes.filter((s) => !s.isDone);
  }
}
