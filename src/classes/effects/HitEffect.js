import * as THREE from "three";

export default class HitEffect {
  constructor(game, position, normal = new THREE.Vector3(0, 1, 0)) {
    this.game = game;

    if (
      position.x !== undefined &&
      position.y !== undefined &&
      position.z !== undefined
    )
      this.position = new THREE.Vector3(position.x, position.y, position.z);
    else this.position = position.clone();

    if (
      normal.x !== undefined &&
      normal.y !== undefined &&
      normal.z !== undefined
    )
      this.normal = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();
    else this.normal = normal.clone().normalize();

    this.duration = 1.2;
    this.elapsed = 0;
    this.isDone = false;
    this.objects = [];

    this.createSparks();
    this.createDebris();
    this.createMuzzleFlash();
    this.game.smokeManager.createSmoke({
      position: this.position,
      duration: this.duration,
    });
  }
  createSparks() {
    this.sparks = [];
    const sparkCount = 12;

    for (let i = 0; i < sparkCount; i++) {
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 4, 4),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.08 + Math.random() * 0.1, 1, 0.8),
          transparent: true,
          opacity: 1,
        })
      );

      spark.position.copy(this.position);

      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI * 0.3;
      const speed = 3 + Math.random() * 4;

      spark.velocity = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed + Math.random() * 2,
        Math.sin(angle) * Math.cos(elevation) * speed
      );

      spark.velocity.add(
        new THREE.Vector3().copy(this.normal).multiplyScalar(Math.random() * 2)
      );

      spark.gravity = new THREE.Vector3(0, -12, 0);
      spark.drag = 0.98;
      spark.life = 0.3 + Math.random() * 0.4;
      spark.maxLife = spark.life;

      this.sparks.push(spark);
      this.objects.push(spark);
      this.game.scene.add(spark);
    }
  }
  createDebris() {
    this.debris = [];
    const debrisCount = 15;

    for (let i = 0; i < debrisCount; i++) {
      const size = 0.01 + Math.random() * 0.03;
      const debrisGeometry = new THREE.BoxGeometry(size, size * 0.5, size);
      const debrisMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.1, 0.3, 0.1 + Math.random() * 0.4),
        transparent: true,
        opacity: 1,
      });

      const chunk = new THREE.Mesh(debrisGeometry, debrisMaterial);
      chunk.position.copy(this.position);

      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI * 0.4;
      const speed = 1 + Math.random() * 3;

      chunk.velocity = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed + Math.random(),
        Math.sin(angle) * Math.cos(elevation) * speed
      );

      chunk.velocity.add(
        new THREE.Vector3()
          .copy(this.normal)
          .multiplyScalar(Math.random() * 1.5)
      );

      chunk.gravity = new THREE.Vector3(0, -9.8, 0);
      chunk.angularVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );

      this.debris.push(chunk);
      this.objects.push(chunk);
      this.game.scene.add(chunk);
    }
  }
  createMuzzleFlash() {
    const flashGeo = new THREE.ConeGeometry(0.08, 0.3, 6);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlash.position.copy(this.position);
    this.muzzleFlash.position.add(
      new THREE.Vector3().copy(this.normal).multiplyScalar(0.1)
    );

    const muzzleLookAt = new THREE.Vector3()
      .copy(this.position)
      .add(this.normal);
    this.muzzleFlash.lookAt(muzzleLookAt);

    this.objects.push(this.muzzleFlash);
    this.game.scene.add(this.muzzleFlash);
  }
  update(delta) {
    const dt = delta / 1000;
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.duration, 1);

    if (progress < 0.15) {
      const muzzleProgress = progress / 0.15;
      this.muzzleFlash.material.opacity = 0.8 * (1 - muzzleProgress);
      this.muzzleFlash.scale.setScalar(1 + muzzleProgress * 0.5);
    } else this.muzzleFlash.material.opacity = 0;

    for (const spark of this.sparks) {
      spark.life -= dt;
      if (spark.life > 0) {
        spark.velocity.add(
          new THREE.Vector3().copy(spark.gravity).multiplyScalar(dt)
        );
        spark.velocity.multiplyScalar(spark.drag);
        spark.position.add(
          new THREE.Vector3().copy(spark.velocity).multiplyScalar(dt)
        );

        const lifeProgress = 1 - spark.life / spark.maxLife;
        spark.material.opacity = 1 - lifeProgress;

        const hue = 0.08 - lifeProgress * 0.08;
        spark.material.color.setHSL(hue, 1, 0.8 - lifeProgress * 0.3);
      } else {
        spark.material.opacity = 0;
      }
    }

    for (const chunk of this.debris) {
      chunk.velocity.add(
        new THREE.Vector3().copy(chunk.gravity).multiplyScalar(dt)
      );
      chunk.position.add(
        new THREE.Vector3().copy(chunk.velocity).multiplyScalar(dt)
      );

      chunk.rotation.x += chunk.angularVelocity.x * dt;
      chunk.rotation.y += chunk.angularVelocity.y * dt;
      chunk.rotation.z += chunk.angularVelocity.z * dt;

      chunk.material.opacity = 1 - progress * 0.7;
    }

    if (progress >= 1) {
      this.isDone = true;
      this.dispose();
    }
  }
  dispose() {
    for (const obj of this.objects) {
      this.game.scene.remove(obj);

      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
  }
}
