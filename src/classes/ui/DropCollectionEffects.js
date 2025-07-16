export default class DropCollectionEffects {
  constructor(game) {
    this.game = game;
    this.effects = [];
    this.container = document.querySelector(".effects-container");
  }
  createHealthEffect() {
    const healthDisplay = document.querySelector(".health-display");
    const rect = healthDisplay.getBoundingClientRect();

    const original = document.querySelector(".health-effect");

    const effectCount = 6;
    for (let i = 0; i < effectCount; i++) {
      const effect = original.cloneNode(true);
      effect.style.left = `${rect.left + rect.width / 2 - 15}px`;
      effect.style.top = `${rect.top + rect.height / 2 - 15}px`;

      this.container.appendChild(effect);

      requestAnimationFrame(() => {
        effect.style.transform = `translate(${Math.floor(
          Math.random() * 50 - 25
        )}px, ${-Math.floor(Math.random() * 40 + 40)}px)`;
        effect.style.opacity = "0";
      });

      this.effects.push({
        element: effect,
        startTime: Date.now(),
        duration: 2000,
      });
    }
  }
  createAmmoEffect() {
    const ammoDisplay = document.querySelector(".ammo-display");
    const rect = ammoDisplay.getBoundingClientRect();

    const original = document.querySelector(".ammo-effect");
    const effect = original.cloneNode(true);

    effect.style.left = `${rect.left + rect.width / 2 - 30}px`;
    effect.style.top = `${rect.top + rect.height / 2 - 10}px`;

    this.container.appendChild(effect);

    requestAnimationFrame(() => {
      effect.style.transform = "translateY(-80px)";
      effect.style.opacity = "0";
    });

    this.effects.push({
      element: effect,
      startTime: Date.now(),
      duration: 2000,
    });
  }
  update() {
    const currentTime = Date.now();
    this.effects = this.effects.filter(({ element, startTime, duration }) => {
      if (currentTime - startTime > duration) {
        element.remove();
        return false;
      }
      return true;
    });
  }
  cleanup() {
    this.effects.forEach(({ element }) => element.remove());
    this.effects = [];
    this.container.innerHTML = "";
  }
}
