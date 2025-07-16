import * as THREE from "three";

import * as CANNON from "cannon-es";

import DamageEffect from "../effects/DamageEffect.js";
import enableModelShadow from "../../utils/enableModelShadow.js";

export default class Player {
  constructor(game) {
    this.game = game;
    this.input = this.game.input;

    this.dead = false;
    this.reloading = false;

    this.damageEffect = new DamageEffect(this.game);

    this.pointerTarget = null;
    this.quaternionWithoutAlignment = null;
    this.position = new THREE.Vector3(0, -0.5, 11);

    this.bodyDimensions = new CANNON.Vec3(0.125, 0.25, 3.8);
    this.body = new CANNON.Body({
      shape: new CANNON.Box(this.bodyDimensions),
      type: CANNON.Body.STATIC,
      position: this.position,
    });

    this.score = { current: 0 };
    this.health = { max: 100, current: 100 };
    this.ammo = {
      maxCurrent: 10,
      current: 10,
      total: 30,
      maxTotal: 50,
    };

    this.reloadDuration = 2000;

    this.bulletsShot = 0;
    this.successfulShots = 0;

    this.recoil = {
      strength: 0.75,
      kickbackSpeed: 0.2,
      recoverySpeed: 0.1,
      vertKickbackSpeed: 0.5,
      vertRecoverySpeed: 0.5,
      offset: new THREE.Vector3(),
      targetOffset: new THREE.Vector3(),
      rotationOffset: new THREE.Quaternion(),
      targetRotationOffset: new THREE.Quaternion(),
    };

    this.isZoomed = false;
    this.targetFov = this.game.fov.default;

    this.model = this.setModel();
    this.audio = this.createAudio();

    this.init();
  }
  setModel() {
    const model = this.game.modelCache.get("player").clone(true);
    model.scale.setScalar(0.4);
    model.rotation.set(0, -Math.PI * 0.5, 0);
    enableModelShadow(model);

    return model;
  }
  createAudio() {
    const shoot = () => {
      const shootingBuffer = this.game.audioCache.get("shoot");
      const shootingSound = new THREE.PositionalAudio(this.game.listener);

      shootingSound.setBuffer(shootingBuffer);
      shootingSound.setRefDistance(5);
      shootingSound.position.copy(this.getMuzzlePosition());

      shootingSound.play();
    };

    const reload = () => {
      const reloadingBuffer = this.game.audioCache.get("reload");
      const reloadingSound = new THREE.PositionalAudio(this.game.listener);

      reloadingSound.setBuffer(reloadingBuffer);
      reloadingSound.setRefDistance(5);
      reloadingSound.position.copy(this.model.position);

      reloadingSound.play();
    };

    const scope = () => {
      const scopingBuffer = this.game.audioCache.get("scope");
      const scopingSound = new THREE.Audio(this.game.listener);

      scopingSound.setBuffer(scopingBuffer);
      scopingSound.setVolume(0.25);

      scopingSound.play();
    };

    const unscope = () => {
      const unscopingBuffer = this.game.audioCache.get("unscope");
      const unscopingSound = new THREE.Audio(this.game.listener);

      unscopingSound.setBuffer(unscopingBuffer);
      unscopingSound.setVolume(0.125);

      unscopingSound.play();
    };

    return { shoot, reload, scope, unscope };
  }
  init() {
    this.model.position.copy(this.position);
    this.game.scene.add(this.model);

    this.game.world.addBody(this.body);
  }
  updatePos() {
    this.position.x = THREE.MathUtils.lerp(
      this.position.x,
      this.input.mouse.pos.x,
      0.1
    );

    let targetY = -0.5;
    if (this.input.mouse.pos.y < -0.85) targetY = -1.6;
    else if (this.input.mouse.pos.y < -0.75) targetY = -1.5;
    else if (this.input.mouse.pos.y < -0.5) targetY = -1.25;
    else if (this.input.mouse.pos.y < -0.375) targetY = -1;
    else if (this.input.mouse.pos.y < -0.25) targetY = -0.75;

    this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, 0.14);

    this.model.position.copy(this.position);
  }
  lookAtPointer() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(this.input.mouse.pos, this.game.camera);

    const target = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1));
    raycaster.ray.intersectPlane(plane, target);

    this.pointerTarget = target.clone();

    const targetQuat = new THREE.Quaternion();
    targetQuat.setFromRotationMatrix(
      new THREE.Matrix4().lookAt(
        this.model.position,
        target,
        new THREE.Vector3(0, 1, 0)
      )
    );

    this.quaternionWithoutAlignment = targetQuat.clone();

    const fixGunAlignmentQuat = new THREE.Quaternion();
    fixGunAlignmentQuat.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      -Math.PI * 0.5
    );
    targetQuat.multiply(fixGunAlignmentQuat);

    this.model.quaternion.slerp(targetQuat, 0.25);
  }
  updateBody() {
    this.body.position.copy(this.position);
    this.body.quaternion.copy(this.quaternionWithoutAlignment);
  }
  shoot() {
    if (this.ammo.current <= 0 || this.reloading) return;

    this.game.bulletManager.createBullet();

    this.ammo.current--;
    this.ammo.current = THREE.MathUtils.clamp(
      this.ammo.current,
      0,
      this.ammo.maxCurrent
    );

    this.game.crosshair.shoot();

    this.bulletsShot++;

    this.game.smokeManager.createSmoke({
      position: this.getMuzzlePosition(),
      smokeCount: 15,
      duration: 2,
    });

    if (this.ammo.current <= 0) this.reload();

    this.applyRecoil();
    this.audio.shoot();
  }
  applyRecoil() {
    const recoilDirection = new THREE.Vector3(1, 0, 0);
    recoilDirection.applyQuaternion(this.model.quaternion);
    recoilDirection.multiplyScalar(this.recoil.strength);

    this.recoil.targetOffset.copy(recoilDirection);

    const recoilRot = new THREE.Quaternion();
    recoilRot.setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(-4)
    );
    this.recoil.targetRotationOffset.copy(recoilRot);
  }
  updateRecoil() {
    this.recoil.offset.lerp(
      this.recoil.targetOffset,
      this.recoil.kickbackSpeed
    );
    this.model.position.add(this.recoil.offset);
    this.recoil.targetOffset.lerp(
      new THREE.Vector3(0, 0, 0),
      this.recoil.recoverySpeed
    );

    this.recoil.rotationOffset.slerp(
      this.recoil.targetRotationOffset,
      this.recoil.vertKickbackSpeed
    );

    const finalRotation = this.model.quaternion.clone();
    finalRotation.multiply(this.recoil.rotationOffset);
    this.model.quaternion.copy(finalRotation);

    this.recoil.targetRotationOffset.slerp(
      new THREE.Quaternion(),
      this.recoil.vertRecoverySpeed
    );
  }
  reload() {
    if (
      this.reloading ||
      this.ammo.current >= this.ammo.maxCurrent ||
      this.ammo.total <= 0
    )
      return;

    this.reloading = true;
    setTimeout(() => {
      const prevCurrent = this.ammo.current;
      const ammoToAdd =
        this.ammo.total < 10
          ? this.ammo.total
          : this.ammo.maxCurrent - prevCurrent;

      this.ammo.current += ammoToAdd;
      this.ammo.total -= ammoToAdd;

      this.ammo.total = THREE.MathUtils.clamp(
        this.ammo.total,
        0,
        this.ammo.maxTotal
      );
      this.reloading = false;
    }, this.reloadDuration);

    this.audio.reload();
  }
  zoomIn() {
    if (!this.isZoomed) this.audio.scope();

    this.isZoomed = true;
    this.targetFov = this.game.fov.zoomed;
  }
  zoomOut() {
    if (this.isZoomed) this.audio.unscope();

    this.isZoomed = false;
    this.targetFov = this.game.fov.default;
  }
  updateCameraFov() {
    this.game.camera.fov = THREE.MathUtils.lerp(
      this.game.camera.fov,
      this.targetFov,
      0.1
    );
    this.game.camera.updateProjectionMatrix();
  }
  updateZoom() {
    if (this.input.mouse.rightClick.current) this.zoomIn();
    else this.zoomOut();
  }
  update() {
    if (this.dead) {
      this.updateDeathAnimation();
      return;
    }

    if (this.game.isPaused) return;

    this.updatePos();
    this.lookAtPointer();
    this.updateBody();
    this.updateRecoil();
    this.damageEffect.update();

    if (
      !this.input.mouse.leftClick.previous &&
      this.input.mouse.leftClick.current
    )
      this.shoot();

    if (this.input.keys.includes("KeyR")) this.reload();

    this.updateZoom();
    this.updateCameraFov();
  }
  damage() {
    const dmg = this.game.difficultyManager.getDamageAmount();

    this.health.current -= dmg;
    this.health.current = THREE.MathUtils.clamp(
      this.health.current,
      0,
      this.health.max
    );

    this.damageEffect.triggerDamageEffect(dmg);
  }
  addScore() {
    this.score.current += this.game.difficultyManager.getScoreAmount();
  }
  getMuzzlePosition() {
    const muzzlePos = new THREE.Vector3(-11.25, 0.15, 0);
    return this.model.localToWorld(muzzlePos);
  }
  getBulletQuaternion() {
    return this.quaternionWithoutAlignment;
  }
  getBulletDirection() {
    return this.pointerTarget.clone().sub(this.getMuzzlePosition()).normalize();
  }
  getAccuracy() {
    let accuracy = Math.floor((this.successfulShots / this.bulletsShot) * 100);
    if (!accuracy) accuracy = 0;

    return accuracy;
  }
  updateDeathAnimation() {
    this.model.position.copy(this.body.position);

    const fixGunAlignmentQuat = new THREE.Quaternion();
    fixGunAlignmentQuat.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      -Math.PI * 0.5
    );
    this.model.quaternion.copy(this.body.quaternion.mult(fixGunAlignmentQuat));
  }
  playDeathAnimation() {
    this.game.hideUI();
    this.zoomOut();

    this.dead = true;

    this.game.world.removeBody(this.body);

    this.body.type = CANNON.Body.DYNAMIC;
    this.body.mass = 1;
    this.body.updateMassProperties();

    this.body.linearDamping = 0.5;
    this.body.angularDamping = 0.1;

    this.body.velocity.set(0, 1, -20);
    this.body.angularVelocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );

    this.game.world.addBody(this.body);
  }
}
