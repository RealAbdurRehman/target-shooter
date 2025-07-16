import * as THREE from "three";

import Target from "./Target.js";

export default class EnemyManger {
  constructor(game) {
    this.game = game;
    this.difficultySettings = this.game.difficultyManager.difficultySettings;

    this.initialDelay = 3500;
    this.timeToNewEnemy = -this.initialDelay;
    this.maxEnemies = this.difficultySettings.base.maxEnemies;
    this.enemyInterval = this.difficultySettings.base.enemyInterval;
    this.enemyDuration = this.difficultySettings.base.enemyDuration;

    this.enemies = [];
    this.enemyTypes = ["target"];

    this.movementPatterns = [
      "sideways",
      "vertical",
      "circular",
      "zigzag",
      "pendulum",
      "orbit",
      "wave",
      "butterfly",
      "static",
    ];
  }

  createEnemy(enemy) {
    this.enemies.push(enemy);
  }

  spawnEnemies() {
    if (this.enemies.length >= this.maxEnemies) return;

    this.timeToNewEnemy += this.game.delta;
    if (this.timeToNewEnemy >= this.enemyInterval) {
      const randIndex = Math.floor(Math.random() * this.enemyTypes.length);
      const typeToSpawn = this.enemyTypes[randIndex];

      if (typeToSpawn === this.enemyTypes[0]) {
        const movementPattern =
          this.movementPatterns[
            Math.floor(Math.random() * this.movementPatterns.length)
          ];

        this.createEnemy(
          new Target(this.game, this.getEnemyPosition(), movementPattern)
        );
      }

      this.timeToNewEnemy -= this.enemyInterval;
    }
  }

  updateEnemies() {
    for (const enemy of this.enemies) {
      enemy.update();

      if (enemy.elapsed >= this.enemyDuration) enemy.disappear();

      if (enemy.isMarkedForDeletion) enemy.remove();
    }

    this.enemies = this.enemies.filter((e) => !e.isMarkedForDeletion);
  }

  update() {
    this.spawnEnemies();
    this.updateEnemies();
  }

  getEnemyPosition() {
    const x = Math.floor(Math.random() * 27) - 13;
    const y = Math.floor(Math.random() * 5) - 1;
    const z = Math.floor(Math.random() * 43) - 45;

    return new THREE.Vector3(x, y, z);
  }
}
