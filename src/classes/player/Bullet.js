import * as THREE from "three";
import * as CANNON from "cannon-es";

import enableObjectShadow from "../../utils/enableObjectShadow";
import removeModel from "../../utils/removeModel";

export default class Bullet {
  constructor(game) {
    this.game = game;
    this.player = this.game.player;

    this.speed = 75;
    this.direction = this.player.getBulletDirection();
    this.initialPosition = this.player.getMuzzlePosition();
    this.initialQuaternion = this.player.getBulletQuaternion();

    this.scale = 0.1;
    this.dimensions = new THREE.Vector3(1, 1, 2).multiplyScalar(this.scale);

    this.model = this.createModel();
    this.body = this.createBody();
    this.body.gameObjectType = "bullet";
    this.body.gameObjectRef = this;

    this.trailLength = 6;
    this.trailPositions = [];
    this.trail = this.createTrail();

    this.stationaryThreshold = 0.1;
    this.isMarkedForDeletion = false;

    this.fadeElapsed = 0;
    this.fadeDuration = 10.0;
    this.fadingOut = false;

    this.onCollideHandler = this.onCollide.bind(this);

    this.init();
  }
  init() {
    this.game.scene.add(this.model);
    this.game.scene.add(this.trail);

    this.body.addEventListener("collide", this.onCollideHandler);
    this.game.world.addBody(this.body);

    this.update();
  }
  createModel() {
    const group = new THREE.Group();

    const tip = new THREE.Mesh(
      new THREE.BoxGeometry(
        this.dimensions.x,
        this.dimensions.y,
        this.dimensions.z * 0.5
      ),
      new THREE.MeshStandardMaterial({
        color: 0xc57f63,
        transparent: true,
        opacity: 1,
      })
    );
    tip.position.set(0, 0, -this.dimensions.z * 0.75);
    enableObjectShadow(tip);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(
        this.dimensions.x,
        this.dimensions.y,
        this.dimensions.z
      ),
      new THREE.MeshStandardMaterial({
        color: 0xd5d097,
        transparent: true,
        opacity: 1,
      })
    );
    enableObjectShadow(body);

    group.add(tip, body);

    return group;
  }
  createBody() {
    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.dimensions.x * 0.5,
          this.dimensions.y * 0.5,
          this.dimensions.z
        )
      ),
      material: this.game.bouncyMat,
      position: this.initialPosition,
      quaternion: this.initialQuaternion,
      angularDamping: 1,
    });

    body.velocity.set(
      this.direction.x * this.speed,
      this.direction.y * this.speed,
      this.direction.z * this.speed
    );

    return body;
  }
  createTrail() {
    const trailMat = new THREE.MeshStandardMaterial({
      color: 0xf8f8ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const trailGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        this.model.position.clone(),
        this.model.position.clone(),
      ]),
      this.trailLength * 2,
      (i) => 0.05 * (1 - i),
      8,
      false
    );

    const mesh = new THREE.Mesh(trailGeo, trailMat);
    mesh.frustumCulled = false;
    return mesh;
  }
  updatePos() {
    this.model.position.copy(this.body.position);
    this.model.quaternion.copy(this.body.quaternion);
  }
  updateTrail() {
    this.trailPositions.push(this.model.position.clone());
    if (this.trailPositions.length > this.trailLength)
      this.trailPositions.shift();

    if (this.trailPositions.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(this.trailPositions);
    const newGeometry = new THREE.TubeGeometry(
      curve,
      this.trailLength * 2,
      0.05,
      8,
      false
    );

    this.trail.geometry.dispose();
    this.trail.geometry = newGeometry;
  }
  checkDeletion() {
    if (this.isStationary() || (this.isOutOfBounds() && !this.fadingOut))
      this.fadingOut = true;
  }
  updateFade() {
    if (!this.fadingOut) return;

    this.fadeElapsed += this.game.delta / 1000;

    const alpha = Math.max(0, 1 - this.fadeElapsed / this.fadeDuration);

    this.model.traverse((child) => {
      if (child.isMesh && child.material) child.material.opacity = alpha;
    });

    if (this.trail.material && this.trail.material.transparent)
      this.trail.material.opacity = alpha * 0.3;

    if (alpha <= 0) {
      this.isMarkedForDeletion = true;
      this.remove();
    }
  }
  update() {
    this.updatePos();
    this.updateTrail();
    this.checkDeletion();
    this.updateFade();
  }
  onCollide(event) {
    if (this.fadingOut || this.isMarkedForDeletion) return;

    const other = event.body;

    this.game.hitEffectManager.create(this.body.position.clone());

    if (other.gameObjectType === "enemy") {
      this.game.crosshair.enableHitMarker();

      other.gameObjectRef.audio.shatter();

      this.game.shatterEffectManager.createShatterEffect(
        other.gameObjectRef.model,
        this.body.position.clone()
      );

      this.player.addScore();
      this.player.successfulShots++;

      this.isMarkedForDeletion = true;
      other.gameObjectRef.isMarkedForDeletion = true;
    } else if (other.gameObjectType === "ammo") {
      this.isMarkedForDeletion = true;
      this.player.bulletsShot--;
      other.gameObjectRef.onCollision();
      this.game.dropCollectionEffects.createAmmoEffect();
    } else if (other.gameObjectType === "health") {
      this.isMarkedForDeletion = true;
      this.player.bulletsShot--;
      other.gameObjectRef.onCollision();
      this.game.dropCollectionEffects.createHealthEffect();
    }
  }
  isOutOfBounds() {
    return (
      Math.abs(this.model.position.x) > 100 ||
      Math.abs(this.model.position.y) > 100 ||
      Math.abs(this.model.position.z) > 100
    );
  }
  isStationary() {
    const v = this.body.velocity;
    return (
      v.lengthSquared() < this.stationaryThreshold * this.stationaryThreshold
    );
  }
  remove() {
    this.game.scene.remove(this.model);
    this.game.scene.remove(this.trail);

    this.trail.geometry.dispose();
    this.trail.material.dispose();

    removeModel(this.model);

    this.body.removeEventListener("collide", this.onCollideHandler);
    this.game.world.removeBody(this.body);
  }
}
