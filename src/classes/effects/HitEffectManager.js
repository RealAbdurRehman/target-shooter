import HitEffect from "./HitEffect.js";

export default class HitEffectManager {
  constructor(game) {
    this.game = game;
    this.effects = [];
  }
  create(position) {
    this.effects.push(new HitEffect(this.game, position));
  }
  update() {
    for (const effect of this.effects) effect.update(this.game.delta);

    this.effects = this.effects.filter((e) => !e.isDone);
  }
}
