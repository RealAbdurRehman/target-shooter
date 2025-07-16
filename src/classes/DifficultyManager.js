import DifficultyNotification from "./ui/DifficultyNotification";

export default class DifficultyManager {
  constructor(game) {
    this.game = game;

    this.notification = new DifficultyNotification();

    this.gameStartTime = Date.now();
    this.currentGameTime = 0;

    this.baseScore = 5;

    this.difficultySettings = {
      base: {
        enemyInterval: 2500,
        maxEnemies: 5,
        enemyDuration: 7500,
        damageRange: { min: 5, max: 10 },
        movementSpeed: 0.5,
        movementAmplitude: 1.0,
        movementFrequency: 1.0,
      },
      max: {
        enemyInterval: 1750,
        maxEnemies: 8,
        enemyDuration: 4000,
        damageRange: { min: 8, max: 14 },
        movementSpeed: 0.75,
        movementAmplitude: 2.0,
        movementFrequency: 1.5,
      },
      progression: {
        intervalReduction: 0.8,
        maxEnemyIncrease: 0.7,
        durationReduction: 0.85,
        damageIncrease: 0.5,
        speedIncrease: 0.3,
        amplitudeIncrease: 0.25,
        frequencyIncrease: 0.2,
      },
    };

    this.progressionInterval = 15000;
    this.lastProgressionTime = 0;
    this.difficultyLevel = 0;

    this.currentDifficulty = {
      enemyInterval: this.difficultySettings.base.enemyInterval,
      maxEnemies: this.difficultySettings.base.maxEnemies,
      enemyDuration: this.difficultySettings.base.enemyDuration,
      damageRange: { ...this.difficultySettings.base.damageRange },
      movementSpeed: this.difficultySettings.base.movementSpeed,
      movementAmplitude: this.difficultySettings.base.movementAmplitude,
      movementFrequency: this.difficultySettings.base.movementFrequency,
    };

    this.targetDifficulty = { ...this.currentDifficulty };
    this.lerpSpeed = 0.02;
  }
  update() {
    this.currentGameTime = Date.now() - this.gameStartTime;

    if (
      this.currentGameTime - this.lastProgressionTime >=
      this.progressionInterval
    ) {
      this.increaseDifficulty();
      this.lastProgressionTime = this.currentGameTime;
    }

    this.smoothTransition();
    this.applyDifficulty();
  }
  increaseDifficulty() {
    this.difficultyLevel++;

    this.notification.show(this.difficultyLevel);

    const { base, max, progression } = this.difficultySettings;

    this.targetDifficulty.enemyInterval = Math.max(
      base.enemyInterval *
        Math.pow(progression.intervalReduction, this.difficultyLevel),
      max.enemyInterval
    );

    this.targetDifficulty.maxEnemies = Math.min(
      Math.round(
        base.maxEnemies + progression.maxEnemyIncrease * this.difficultyLevel
      ),
      max.maxEnemies
    );

    this.targetDifficulty.enemyDuration = Math.max(
      base.enemyDuration *
        Math.pow(progression.durationReduction, this.difficultyLevel),
      max.enemyDuration
    );

    const damageIncrease = progression.damageIncrease * this.difficultyLevel;
    this.targetDifficulty.damageRange.min = Math.min(
      base.damageRange.min + damageIncrease,
      max.damageRange.min
    );
    this.targetDifficulty.damageRange.max = Math.min(
      base.damageRange.max + damageIncrease,
      max.damageRange.max
    );

    this.targetDifficulty.movementSpeed = Math.min(
      base.movementSpeed + progression.speedIncrease * this.difficultyLevel,
      max.movementSpeed
    );

    this.targetDifficulty.movementAmplitude = Math.min(
      base.movementAmplitude +
        progression.amplitudeIncrease * this.difficultyLevel,
      max.movementAmplitude
    );

    this.targetDifficulty.movementFrequency = Math.min(
      base.movementFrequency +
        progression.frequencyIncrease * this.difficultyLevel,
      max.movementFrequency
    );
  }
  smoothTransition() {
    this.currentDifficulty.enemyInterval = this.lerp(
      this.currentDifficulty.enemyInterval,
      this.targetDifficulty.enemyInterval,
      this.lerpSpeed
    );

    this.currentDifficulty.maxEnemies = this.lerp(
      this.currentDifficulty.maxEnemies,
      this.targetDifficulty.maxEnemies,
      this.lerpSpeed
    );

    this.currentDifficulty.enemyDuration = this.lerp(
      this.currentDifficulty.enemyDuration,
      this.targetDifficulty.enemyDuration,
      this.lerpSpeed
    );

    this.currentDifficulty.damageRange.min = this.lerp(
      this.currentDifficulty.damageRange.min,
      this.targetDifficulty.damageRange.min,
      this.lerpSpeed
    );

    this.currentDifficulty.damageRange.max = this.lerp(
      this.currentDifficulty.damageRange.max,
      this.targetDifficulty.damageRange.max,
      this.lerpSpeed
    );

    this.currentDifficulty.movementSpeed = this.lerp(
      this.currentDifficulty.movementSpeed,
      this.targetDifficulty.movementSpeed,
      this.lerpSpeed
    );

    this.currentDifficulty.movementAmplitude = this.lerp(
      this.currentDifficulty.movementAmplitude,
      this.targetDifficulty.movementAmplitude,
      this.lerpSpeed
    );

    this.currentDifficulty.movementFrequency = this.lerp(
      this.currentDifficulty.movementFrequency,
      this.targetDifficulty.movementFrequency,
      this.lerpSpeed
    );
  }
  applyDifficulty() {
    this.game.enemyManager.enemyInterval = Math.round(
      this.currentDifficulty.enemyInterval
    );
    this.game.enemyManager.maxEnemies = Math.round(
      this.currentDifficulty.maxEnemies
    );
    this.game.enemyManager.enemyDuration = Math.round(
      this.currentDifficulty.enemyDuration
    );
  }
  getDamageAmount() {
    const { min, max } = this.currentDifficulty.damageRange;
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  getMovementSettings() {
    return {
      speed: this.currentDifficulty.movementSpeed,
      amplitude: this.currentDifficulty.movementAmplitude,
      frequency: this.currentDifficulty.movementFrequency,
    };
  }
  getScoreAmount() {
    const spawnRateMultiplier =
      this.difficultySettings.base.enemyInterval /
      this.currentDifficulty.enemyInterval;

    const enemyCountMultiplier =
      this.currentDifficulty.maxEnemies /
      this.difficultySettings.base.maxEnemies;

    const damageMultiplier =
      this.currentDifficulty.damageRange.max /
      this.difficultySettings.base.damageRange.max;

    const totalMultiplier =
      (spawnRateMultiplier + enemyCountMultiplier + damageMultiplier) / 3;

    return Math.round(this.baseScore * totalMultiplier);
  }
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }
  getDifficultyStats() {
    return {
      level: this.difficultyLevel,
      gameTime: Math.round(this.currentGameTime / 1000),
      enemySpawnRate: Math.round(this.currentDifficulty.enemyInterval),
      maxEnemies: Math.round(this.currentDifficulty.maxEnemies),
      enemyLifetime: Math.round(this.currentDifficulty.enemyDuration),
      damageRange: {
        min: Math.round(this.currentDifficulty.damageRange.min),
        max: Math.round(this.currentDifficulty.damageRange.max),
      },
      movementSpeed: this.currentDifficulty.movementSpeed.toFixed(2),
      movementAmplitude: this.currentDifficulty.movementAmplitude.toFixed(2),
      movementFrequency: this.currentDifficulty.movementFrequency.toFixed(2),
    };
  }
}
