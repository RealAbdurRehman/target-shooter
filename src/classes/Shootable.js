import * as THREE from "three";

import gsap from "gsap";

import removeModel from "../utils/removeModel.js";
import enableModelShadow from "../utils/enableModelShadow.js";

export default class Shootable {
  constructor({
    game,
    position = new THREE.Vector3(),
    model,
    scale = 1,
    offset = new THREE.Vector3(),
    spawnAnimationDuration = 0.6,
    disappearAnimationDuration = 0.4,
  }) {
    this.game = game;
    this.position = position;
    this.scale = scale;
    this.offset = offset;
    this.spawnAnimationDuration = spawnAnimationDuration;
    this.disappearAnimationDuration = disappearAnimationDuration;

    this.disappearing = false;

    this.model = this.setModel(model);

    this.isMarkedForDeletion = false;
    this.elapsed = 0;
  }
  setModel(model) {
    model.scale.setScalar(this.scale);
    enableModelShadow(model);
    return model;
  }
  init() {
    this.model.scale.setScalar(0);

    gsap.to(this.model.scale, {
      x: this.scale,
      y: this.scale,
      z: this.scale,
      duration: this.spawnAnimationDuration,
      ease: "back.out(1.7)",
    });

    this.update();

    this.game.scene.add(this.model);
    this.game.world.addBody(this.body);
  }
  move() {
    this.model.position.copy(
      this.body.position
        .clone()
        .vadd(this.offset.clone().applyQuaternion(this.body.quaternion))
    );
    this.model.quaternion.copy(this.body.quaternion);
  }
  update() {
    if (!this.model) return;

    this.move();

    this.elapsed += this.game.delta;
  }
  remove() {
    this.game.scene.remove(this.model);
    removeModel(this.model);

    this.game.world.removeBody(this.body);
  }
  disappear() {
    if (this.disappearing) return;

    if (this.isEnemy) this.game.world.removeBody(this.body);

    this.disappearing = true;
    gsap.to(this.model.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: this.disappearAnimationDuration,
      ease: "back.out(1)",
      onComplete: () => {
        if (this.isEnemy) this.game.player.damage();
        this.isMarkedForDeletion = true;
      },
    });
  }
}
