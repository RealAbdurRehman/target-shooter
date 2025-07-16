import ShatterEffect from "./ShatterEffect.js";

export default class ShatterEffectManager {
  constructor(game) {
    this.game = game;
    this.shatterEffects = [];
    this.maxEffects = 10;
    this.pendingCleanup = [];
  }
  createShatterEffect(model, hitPosition) {
    if (this.shatterEffects.length >= this.maxEffects) {
      const oldestEffect = this.shatterEffects.shift();
      this.pendingCleanup.push(oldestEffect);
    }

    const shatterEffect = new ShatterEffect(this.game, model, hitPosition);
    this.shatterEffects.push(shatterEffect);

    return shatterEffect;
  }
  update() {
    for (let i = this.shatterEffects.length - 1; i >= 0; i--) {
      const effect = this.shatterEffects[i];

      effect.update();

      for (let j = effect.fragments.length - 1; j >= 0; j--) {
        const fragment = effect.fragments[j];
        if (fragment.markedForDeletion && !fragment.markedForRemoval)
          fragment.markedForRemoval = true;
      }

      if (effect.isComplete()) this.shatterEffects.splice(i, 1);
    }

    this.cleanup();
  }
  cleanup() {
    for (const effect of this.pendingCleanup) {
      effect.cleanup();
    }
    this.pendingCleanup = [];

    for (const effect of this.shatterEffects) {
      for (let i = effect.fragments.length - 1; i >= 0; i--) {
        const fragment = effect.fragments[i];
        if (fragment.markedForRemoval) {
          this.removeFragment(effect, i);
        }
      }
    }
  }
  removeFragment(effect, index) {
    const fragment = effect.fragments[index];

    if (fragment.mesh) {
      this.game.scene.remove(fragment.mesh);
      if (fragment.mesh.geometry) fragment.mesh.geometry.dispose();
    }

    if (fragment.material) fragment.material.dispose();

    if (fragment.body) this.game.world.removeBody(fragment.body);

    effect.fragments.splice(index, 1);
  }
}
