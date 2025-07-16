import * as THREE from "three";

import CameraShake from "./CameraShake.js";

export default class DamageEffect {
  constructor(game) {
    this.game = game;

    this.cameraShake = new CameraShake(this.game);

    this.damageOverlay = this.createDamageOverlay();
    this.damageVignette = this.createDamageVignette();

    this.chromaticAberration = {
      enabled: false,
      intensity: 0,
      maxIntensity: 0.05,
      duration: 0,
      timer: 0,
    };

    this.fovKick = {
      enabled: false,
      intensity: 0,
      maxIntensity: 15,
      duration: 0,
      timer: 0,
      originalFov: this.game.camera.fov,
    };

    this.heartbeat = {
      enabled: false,
      bpm: 60,
      beatInterval: 60000 / 80,
      timer: 0,
      phase: 0,
      phaseDuration: 100,
      phaseTimer: 0,
      intensity: 0,
      maxIntensity: 0.8,
    };

    this.heartbeatSound = null;
    this.heartbeatPlaying = false;
    this.audio = this.createAudio();

    this.init();
  }
  createAudio() {
    const heartbeat = () => {
      const heartbeatBuffer = this.game.audioCache.get("heartbeat");
      this.heartbeatSound = new THREE.Audio(this.game.listener);
      this.heartbeatSound.setBuffer(heartbeatBuffer);
      this.heartbeatSound.setLoop(true);
      this.heartbeatSound.setVolume(1);

      this.heartbeatSound.play();
      this.heartbeatPlaying = true;
    };

    return { heartbeat };
  }
  createDamageOverlay() {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,0,0,0.1) 0%, rgba(255,0,0,0.3) 100%);
      pointer-events: none;
      z-index: 500;
      opacity: 0;
      transition: opacity 0.1s ease-out;
    `;
    return overlay;
  }
  createDamageVignette() {
    const vignette = document.createElement("div");
    vignette.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, transparent 20%, rgba(139, 0, 0, 0.4) 70%);
      pointer-events: none;
      z-index: 499;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    `;
    return vignette;
  }
  init() {
    document.body.appendChild(this.damageOverlay);
    document.body.appendChild(this.damageVignette);
  }
  triggerDamageEffect(damageAmount = 10) {
    const intensity = Math.min(damageAmount / 30, 1);

    this.cameraShake.shake(0.08 * intensity);

    this.flashRedOverlay(intensity);
    this.showDamageVignette(intensity);
    this.triggerFovKick(intensity);
    this.triggerChromaticAberration(intensity);
    this.desaturateScreen(intensity);
  }
  checkLowHealthState() {
    const currentHealth = this.game.player.health.current;
    const maxHealth = this.game.player.health.max;
    const healthPercentage = currentHealth / maxHealth;

    if (healthPercentage <= 0.25 && currentHealth > 0) {
      if (!this.heartbeat.enabled) {
        this.heartbeat.enabled = true;
        this.heartbeat.timer = 0;
        this.heartbeat.phase = 0;
        this.heartbeat.phaseTimer = 0;
      }

      const criticalHealthFactor = Math.max(0.3, 1 - healthPercentage / 0.25);
      const scaledFactor = Math.pow(criticalHealthFactor, 0.7);
      this.heartbeat.intensity = this.heartbeat.maxIntensity * scaledFactor;

      this.heartbeat.bpm = 80 + 40 * criticalHealthFactor;
      this.heartbeat.beatInterval = 60000 / this.heartbeat.bpm;

      this.damageVignette.style.opacity = criticalHealthFactor * 0.4;
    } else {
      if (this.heartbeat.enabled) {
        this.heartbeat.enabled = false;
        this.stopHeartbeatAudio();
        this.damageVignette.style.opacity = "0";
      }
    }
  }
  updateHeartbeatEffect() {
    if (!this.heartbeat.enabled) return;

    this.heartbeat.timer += this.game.delta;

    if (this.heartbeat.timer >= this.heartbeat.beatInterval) {
      this.heartbeat.timer = 0;
      this.heartbeat.phase = 1;
      this.heartbeat.phaseTimer = 0;

      if (!this.heartbeatPlaying) this.audio.heartbeat();
    }

    if (this.heartbeat.phase > 0) {
      this.heartbeat.phaseTimer += this.game.delta;

      let pulseIntensity = 0;

      if (this.heartbeat.phase === 1) {
        const progress =
          this.heartbeat.phaseTimer / this.heartbeat.phaseDuration;
        pulseIntensity =
          Math.sin(progress * Math.PI) * this.heartbeat.intensity;

        if (this.heartbeat.phaseTimer >= this.heartbeat.phaseDuration) {
          this.heartbeat.phase = 2;
          this.heartbeat.phaseTimer = 0;
        }
      } else if (this.heartbeat.phase === 2) {
        if (this.heartbeat.phaseTimer >= this.heartbeat.phaseDuration * 0.3) {
          this.heartbeat.phase = 3;
          this.heartbeat.phaseTimer = 0;
        }
      } else if (this.heartbeat.phase === 3) {
        const progress =
          this.heartbeat.phaseTimer / this.heartbeat.phaseDuration;
        pulseIntensity =
          Math.sin(progress * Math.PI) * this.heartbeat.intensity * 0.7;

        if (this.heartbeat.phaseTimer >= this.heartbeat.phaseDuration) {
          this.heartbeat.phase = 0;
          this.heartbeat.phaseTimer = 0;
        }
      }

      if (pulseIntensity > 0) {
        this.damageOverlay.style.opacity = pulseIntensity;

        const fovPulse = pulseIntensity * 2;
        this.game.camera.fov = this.game.camera.fov + fovPulse;
        this.game.camera.updateProjectionMatrix();
      }
    }
  }
  flashRedOverlay(intensity) {
    this.damageOverlay.style.opacity = intensity * 0.6;
    setTimeout(() => {
      if (!this.heartbeat.enabled) this.damageOverlay.style.opacity = "0";
    }, 150);
  }
  showDamageVignette(intensity) {
    this.damageVignette.style.opacity = intensity * 0.8;

    setTimeout(() => {
      if (!this.heartbeat.enabled) this.damageVignette.style.opacity = "0";
    }, 500);
  }
  triggerFovKick(intensity) {
    this.fovKick.enabled = true;
    this.fovKick.intensity = this.fovKick.maxIntensity * intensity;
    this.fovKick.duration = 300;
    this.fovKick.timer = this.fovKick.duration;
    this.fovKick.originalFov = this.game.camera.fov;
  }
  triggerChromaticAberration(intensity) {
    this.chromaticAberration.enabled = true;
    this.chromaticAberration.intensity =
      this.chromaticAberration.maxIntensity * intensity;
    this.chromaticAberration.duration = 400;
    this.chromaticAberration.timer = this.chromaticAberration.duration;
  }
  desaturateScreen(intensity) {
    const originalFilter = this.game.renderer.domElement.style.filter;
    this.game.renderer.domElement.style.filter = `saturate(${
      1 - intensity * 0.5
    })`;

    setTimeout(() => {
      this.game.renderer.domElement.style.filter = originalFilter;
    }, 300);
  }
  update() {
    this.cameraShake.update();
    this.checkLowHealthState();
    this.updateHeartbeatEffect();

    if (this.fovKick.enabled) {
      this.fovKick.timer -= this.game.delta;

      if (this.fovKick.timer <= 0) {
        this.fovKick.enabled = false;
        this.game.camera.fov = this.fovKick.originalFov;
      } else {
        const progress = this.fovKick.timer / this.fovKick.duration;
        const currentKick = this.fovKick.intensity * progress;
        this.game.camera.fov = this.fovKick.originalFov + currentKick;
      }

      this.game.camera.updateProjectionMatrix();
    }

    if (this.chromaticAberration.enabled) {
      this.chromaticAberration.timer -= this.game.delta;

      if (this.chromaticAberration.timer <= 0) {
        this.chromaticAberration.enabled = false;
        this.chromaticAberration.intensity = 0;
      } else {
        const progress =
          this.chromaticAberration.timer / this.chromaticAberration.duration;
        this.chromaticAberration.intensity =
          this.chromaticAberration.maxIntensity * progress;

        if (Math.random() < 0.3) {
          const offset = this.chromaticAberration.intensity * 100;
          this.game.renderer.domElement.style.transform = `translate(${
            Math.random() * offset - offset / 2
          }px, ${Math.random() * offset - offset / 2}px)`;

          setTimeout(() => {
            this.game.renderer.domElement.style.transform =
              "translate(0px, 0px)";
          }, 50);
        }
      }
    }
  }
  stopHeartbeatAudio() {
    if (this.heartbeatPlaying) {
      this.heartbeatSound.stop();
      this.heartbeatPlaying = false;
    }
  }
  resumeHeartbeatAudio() {
    if (!this.heartbeatPlaying && !this.heartbeat) {
      this.heartbeatSound.play();
      this.heartbeatPlaying = true;
    }
  }
}
