import * as THREE from "three";

export default class Smoke {
  constructor({ game, smokeCount, position, duration, normal }) {
    this.game = game;
    this.smokeCount = smokeCount;
    this.position = position;
    this.duration = duration;
    this.normal = normal.clone().normalize();

    this.smokePuffs = [];

    this.elapsed = 0;
    this.isDone = false;

    this.init();
  }
  init() {
    this.createSmoke();
    for (const smoke of this.smokePuffs) this.game.scene.add(smoke);
  }
  createSmoke() {
    for (let i = 0; i < this.smokeCount; i++) {
      const smokeGeometry = new THREE.SphereGeometry(
        0.05 + Math.random() * 0.1,
        6,
        6
      );
      const smokeMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0, 0, 0.2 + Math.random() * 0.3),
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });

      const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.copy(this.position);
      smoke.position.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        )
      );

      smoke.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.8 + 0.2,
        (Math.random() - 0.5) * 0.5
      );

      smoke.velocity.add(
        new THREE.Vector3().copy(this.normal).multiplyScalar(0.3)
      );

      smoke.rotationSpeed = (Math.random() - 0.5) * 2;
      smoke.expansionRate = 0.5 + Math.random() * 0.3;
      smoke.initialScale = 0.1 + Math.random() * 0.2;
      smoke.scale.setScalar(smoke.initialScale);

      this.smokePuffs.push(smoke);
    }
  }
  update() {
    const dt = this.game.delta / 1000;
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.duration, 1);

    for (const smoke of this.smokePuffs) {
      smoke.velocity.y += dt * 0.5;
      smoke.velocity.multiplyScalar(0.98);
      smoke.position.add(
        new THREE.Vector3().copy(smoke.velocity).multiplyScalar(dt)
      );

      smoke.rotation.z += smoke.rotationSpeed * dt;

      const scale = smoke.initialScale + progress * smoke.expansionRate;
      smoke.scale.setScalar(scale);

      smoke.material.opacity = 0.6 * (1 - progress) * (1 - progress);
    }

    if (progress >= 1) {
      this.isDone = true;
      this.dispose();
    }
  }
  dispose() {
    for (const smoke of this.smokePuffs) {
      this.game.scene.remove(smoke);

      if (smoke.geometry) smoke.geometry.dispose();
      if (smoke.material) smoke.material.dispose();
    }
  }
}
