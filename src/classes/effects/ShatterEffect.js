import * as THREE from "three";

import * as CANNON from "cannon-es";

import enableObjectShadow from "../../utils/enableObjectShadow";

export default class ShatterEffect {
  constructor(game, originalModel, hitPosition) {
    this.game = game;
    this.originalModel = originalModel;
    this.hitPosition = hitPosition;

    this.createdAt = Date.now();

    this.fragments = [];
    this.fragmentCount = 10 + Math.floor(Math.random() * 6);

    this.fragmentLifetime = 3000 + Math.random() * 1000;

    this.createFragments();
  }
  createFragments() {
    const box = new THREE.Box3().setFromObject(this.originalModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    for (let i = 0; i < this.fragmentCount; i++) {
      const fragment = this.createFragment(size, center, i);
      this.fragments.push(fragment);
    }
  }
  createFragment(originalSize, originalCenter, index) {
    const sizeVariation = Math.random();
    let fragmentScale;

    if (sizeVariation < 0.4) fragmentScale = 0.25 + Math.random() * 0.2;
    else fragmentScale = 0.1 + Math.random() * 0.15;

    const baseSize = originalSize.clone().multiplyScalar(fragmentScale);
    const fragmentSize = new THREE.Vector3(
      baseSize.x * (0.8 + Math.random() * 0.4),
      baseSize.y * (0.8 + Math.random() * 0.4),
      baseSize.z * (0.8 + Math.random() * 0.4)
    );

    let geometry = new THREE.BoxGeometry(
      fragmentSize.x,
      fragmentSize.y,
      fragmentSize.z
    );

    const material = new THREE.MeshStandardMaterial({
      color: this.getFragmentColor(),
      transparent: true,
      opacity: 0.85,
      roughness: 0.8,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    enableObjectShadow(mesh);

    const angle =
      (index / this.fragmentCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const radius = Math.random() * 0.2;
    const heightVariation = (Math.random() - 0.5) * originalSize.y * 0.6;

    mesh.position.set(
      originalCenter.x + Math.cos(angle) * radius,
      originalCenter.y + heightVariation,
      originalCenter.z + Math.sin(angle) * radius
    );

    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    const body = new CANNON.Body({
      mass: fragmentScale * 0.3,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          fragmentSize.x * 0.5,
          fragmentSize.y * 0.5,
          fragmentSize.z * 0.5
        )
      ),
      position: new CANNON.Vec3(
        mesh.position.x,
        mesh.position.y,
        mesh.position.z
      ),
      material: new CANNON.Material({
        friction: 0.6,
        restitution: 0.2 + Math.random() * 0.2,
      }),
    });

    const direction = new THREE.Vector3()
      .subVectors(mesh.position, this.hitPosition)
      .normalize();

    direction.x += (Math.random() - 0.5) * 0.4;
    direction.y += Math.random() * 0.2 + 0.1;
    direction.z += (Math.random() - 0.5) * 0.4;
    direction.normalize();

    this.game.scene.add(mesh);
    this.game.world.addBody(body);

    return {
      mesh,
      body,
      material,
      initialOpacity: 0.85,
      scale: fragmentScale,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
    };
  }
  getFragmentColor() {
    const colors = [
      0x8b4513, 0xa0522d, 0xd2691e, 0x654321, 0x8b7355, 0xf4a460, 0x704214,
      0x5d4037,
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }
  update() {
    const currentTime = Date.now();
    const elapsed = currentTime - this.createdAt;
    const deltaTime = this.game.delta / 1000;

    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const fragment = this.fragments[i];

      fragment.mesh.position.copy(fragment.body.position);
      fragment.mesh.quaternion.copy(fragment.body.quaternion);

      fragment.mesh.rotation.x += fragment.rotationSpeed * deltaTime;
      fragment.mesh.rotation.y += fragment.rotationSpeed * deltaTime;

      if (elapsed > this.fragmentLifetime * 0.7) {
        const fadeProgress =
          (elapsed - this.fragmentLifetime * 0.7) /
          (this.fragmentLifetime * 0.3);
        fragment.material.opacity =
          fragment.initialOpacity * (1 - fadeProgress);
      }

      if (
        elapsed > this.fragmentLifetime ||
        this.isOutOfBounds(fragment.mesh.position)
      )
        fragment.markedForDeletion = true;
    }
  }
  isOutOfBounds(position) {
    return (
      Math.abs(position.x) > 50 || position.y < -20 || Math.abs(position.z) > 50
    );
  }
  removeFragment(index) {
    const fragment = this.fragments[index];

    this.game.scene.remove(fragment.mesh);
    this.game.world.removeBody(fragment.body);

    fragment.mesh.geometry.dispose();
    fragment.material.dispose();

    this.fragments.splice(index, 1);
  }
  isComplete() {
    return this.fragments.length === 0;
  }
  cleanup() {
    for (let i = this.fragments.length - 1; i >= 0; i--) this.removeFragment(i);
  }
}
