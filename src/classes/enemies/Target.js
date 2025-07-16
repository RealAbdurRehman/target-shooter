import * as THREE from "three";

import * as CANNON from "cannon-es";

import Enemy from "./Enemy.js";

export default class Target extends Enemy {
  constructor(game, position, movementPattern = "sideways") {
    const model = game.modelCache.get("target").clone(true);

    super({
      game,
      position,
      model,
      scale: Math.random() * 0.075 + 0.075,
      movementPattern,
    });

    this.radius = 11 * this.scale;
    this.height = 3 * this.scale;

    this.audio = this.createAudio();

    this.init();
  }
  createBody() {
    const shape = new CANNON.Cylinder(
      this.radius,
      this.radius,
      this.height,
      32
    );
    shape.transformAllPoints(
      new CANNON.Vec3(),
      new CANNON.Quaternion().setFromEuler(Math.PI * 0.5, 0, 0)
    );

    const body = new CANNON.Body({
      shape,
      type: CANNON.Body.KINEMATIC,
      position: this.position,
    });
    body.gameObjectType = "enemy";
    body.gameObjectRef = this;

    return body;
  }
  createAudio() {
    const shatter = () => {
      const shatterBuffer = this.game.audioCache.get("shatter");
      const shatterSound = new THREE.PositionalAudio(this.game.listener);

      shatterSound.setBuffer(shatterBuffer);
      shatterSound.setRefDistance(4);
      shatterSound.setMaxDistance(50);
      shatterSound.setRolloffFactor(2);
      shatterSound.setDistanceModel("exponential");

      shatterSound.play();
    };

    return { shatter };
  }
}
