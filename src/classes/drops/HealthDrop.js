import * as THREE from "three";

import * as CANNON from "cannon-es";

import Shootable from "../Shootable.js";

export default class HealthDrop extends Shootable {
  constructor({ game, position }) {
    const model = game.modelCache.get("health").clone(true);

    super({
      game,
      position,
      model,
      spawnAnimationDuration: 1,
      scale: 1.25,
      disappearAnimationDuration: 0.75,
    });

    this.body = this.createBody();
    this.audio = this.createAudio();

    this.healthAmount = Math.floor(Math.random() * 25 + 15);

    this.init();
  }
  createBody() {
    const body = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(1.25, 0.8, 0.45)),
      mass: 100,
      position: this.position,
      angularDamping: 1,
    });
    body.gameObjectType = "health";
    body.gameObjectRef = this;

    return body;
  }
  createAudio() {
    const heal = () => {
      const healingBuffer = this.game.audioCache.get("heal");
      const healingSound = new THREE.PositionalAudio(this.game.listener);

      healingSound.setBuffer(healingBuffer);
      healingSound.setRefDistance(2);
      healingSound.position.copy(this.model.position);

      healingSound.play();
    };

    return { heal };
  }
  onCollision() {
    if (this.isMarkedForDeletion || this.disappearing) return;

    this.game.player.health.current = THREE.MathUtils.clamp(
      this.game.player.health.current + this.healthAmount,
      0,
      this.game.player.health.max
    );

    this.audio.heal();
    this.disappear();
  }
}
