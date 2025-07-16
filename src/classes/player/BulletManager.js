import Bullet from "./Bullet.js";

export default class BulletManager {
  constructor(game) {
    this.game = game;

    this.bullets = [];
  }
  createBullet() {
    this.bullets.push(new Bullet(this.game));
  }
  update() {
    for (const bullet of this.bullets) bullet.update();
    this.cleanupBullets();
  }
  cleanupBullets() {
    for (const bullet of this.bullets) {
      if (bullet.isMarkedForDeletion) bullet.remove();
    }

    this.bullets = this.bullets.filter((b) => !b.isMarkedForDeletion);
  }
}
