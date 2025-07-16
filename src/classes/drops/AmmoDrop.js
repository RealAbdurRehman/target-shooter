import * as THREE from "three";

import * as CANNON from "cannon-es";

import Shootable from "../Shootable.js";

export default class AmmoDrop extends Shootable {
  constructor({ game, position }) {
    const model = game.modelCache.get("ammo").clone(true);

    super({
      game,
      position,
      model,
      scale: 7,
      offset: new THREE.Vector3(0, -0.725, -0.1),
      spawnAnimationDuration: 1,
      disappearAnimationDuration: 0.75,
    });

    this.body = this.createBody();
    this.audio = this.createAudio();

    this.ammoAmount = Math.floor(Math.random() * 11 + 10);

    this.init();
  }
  createBody() {
    const body = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.75, 1.125)),
      mass: 100,
      position: this.position,
      angularDamping: 1,
      quaternion: new CANNON.Quaternion(0, Math.PI * 0.5, 0, Math.PI * 0.5),
    });
    body.gameObjectType = "ammo";
    body.gameObjectRef = this;

    return body;
  }
  createAudio() {
    const collection = () => {
      const collectionBuffer = this.game.audioCache.get(
        `collection${Math.random() > 0.5 ? 1 : 2}`
      );
      const collectionSound = new THREE.PositionalAudio(this.game.listener);

      collectionSound.setBuffer(collectionBuffer);
      collectionSound.setRefDistance(2);
      collectionSound.position.copy(this.model.position);

      collectionSound.play();
    };

    return { collection };
  }
  onCollision() {
    if (this.isMarkedForDeletion || this.disappearing) return;

    this.game.player.ammo.total = THREE.MathUtils.clamp(
      this.game.player.ammo.total + this.ammoAmount,
      0,
      this.game.player.ammo.maxTotal
    );

    this.audio.collection();
    this.disappear();
  }
}
