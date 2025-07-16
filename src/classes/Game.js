import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import {
  EffectComposer,
  RenderPass,
  GlitchPass,
} from "three/examples/jsm/Addons.js";

import * as CANNON from "cannon-es";

import LoadingScreen from "./ui/LoadingScreen.js";
import PauseScreen from "./ui/PauseScreen.js";
import DeathScreen from "./ui/DeathScreen.js";
import Crosshair from "./ui/Crosshair.js";
import HUD from "./ui/HUD.js";
import DropCollectionEffects from "./ui/DropCollectionEffects.js";

import Map from "./Map.js";
import SkyManager from "./SkyManager.js";
import Player from "./player/Player.js";
import InputHandler from "./InputHandler.js";
import EnemyManger from "./enemies/EnemyManager.js";
import BulletManager from "./player/BulletManager.js";
import SmokeManager from "./effects/SmokeManager.js";
import HitEffectManager from "./effects/HitEffectManager.js";
import ShatterEffectManager from "./effects/ShatterEffectManager.js";
import DropManager from "./drops/DropManager.js";
import DifficultyManager from "./DifficultyManager.js";

import enableLightShadow from "../utils/enableLightShadow.js";

export default class Game {
  constructor() {
    this.isLoading = true;
    this.gameOver = false;
    this.isPaused = false;

    this.scene = new THREE.Scene();
    this.renderer = this.createRenderer();
    this.composer = new EffectComposer(this.renderer);
    this.fov = { default: 75, zoomed: 60 };
    this.camera = this.createCamera();
    this.listener = this.createListener();

    this.loadingManager = this.createLoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.audioLoader = new THREE.AudioLoader(this.loadingManager);
    this.loadingScreen = new LoadingScreen(this);

    this.audioCache = new window.Map();
    this.loadAudio();

    this.modelCache = new window.Map();
    this.loadModels();

    this.lights = this.createLights();

    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });
    this.bouncyMat = this.createBouncyMat();
    this.timeStep = 1 / 120;

    this.delta = 0;
    this.maxDelta = 50;

    this.lastTime = 0;
    this.timeToNewFrame = 0;
    this.frameInterval = 1000 / 60;

    this.setupVisibilityHandlers();
  }
  setupVisibilityHandlers() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.autoPause();
    });

    window.addEventListener("blur", () => this.autoPause());
  }
  init() {
    window.addEventListener("resize", this.resize.bind(this));
    document.body.appendChild(this.renderer.domElement);

    this.setupPostProcessing();

    for (const light of this.lights) this.scene.add(light);

    this.renderer.setAnimationLoop(this.animate.bind(this));
  }
  setupPostProcessing() {
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.glitchPass = new GlitchPass();
    this.glitchPass.goWild = 0.5;
    this.glitchPass.enabled = false;
    this.composer.addPass(this.glitchPass);
  }
  createLights() {
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0xffffff, 2);
    const ambientLight = new THREE.AmbientLight(0x98dffc, 1);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(0, 20, 0);
    enableLightShadow({
      light: directionalLight,
      mapSize: { width: 2048, height: 2048 },
    });

    return [directionalLight, hemiLight, ambientLight];
  }
  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
  createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    return renderer;
  }
  createListener() {
    const listener = new THREE.AudioListener();
    this.camera.add(listener);

    return listener;
  }
  createCamera() {
    const camera = new THREE.PerspectiveCamera(
      this.fov.default,
      window.innerWidth / window.innerHeight,
      0.1
    );
    camera.position.set(0, 0, 13);

    return camera;
  }
  loadAudio() {
    this.audioLoader.load("/audio/player/shoot.mp3", (buffer) => {
      this.audioCache.set("shoot", buffer);
    });

    this.audioLoader.load("/audio/player/scope.wav", (buffer) => {
      this.audioCache.set("scope", buffer);
    });

    this.audioLoader.load("/audio/player/unscope.wav", (buffer) => {
      this.audioCache.set("unscope", buffer);
    });

    this.audioLoader.load("/audio/player/reload.wav", (buffer) => {
      this.audioCache.set("reload", buffer);
    });

    this.audioLoader.load("/audio/player/heartbeat.mp3", (buffer) => {
      this.audioCache.set("heartbeat", buffer);
    });

    this.audioLoader.load("/audio/drops/ammo/collection1.flac", (buffer) => {
      this.audioCache.set("collection1", buffer);
    });

    this.audioLoader.load("/audio/drops/ammo/collection2.flac", (buffer) => {
      this.audioCache.set("collection2", buffer);
    });

    this.audioLoader.load("/audio/drops/health/heal.flac", (buffer) => {
      this.audioCache.set("heal", buffer);
    });

    this.audioLoader.load("/audio/ui/hitmarker.mp3", (buffer) => {
      this.audioCache.set("hitmarker", buffer);
    });

    this.audioLoader.load("/audio/enemies/target/shatter.wav", (buffer) => {
      this.audioCache.set("shatter", buffer);
    });
  }
  loadModels() {
    this.gltfLoader.load("/player/scene.glb", (gltf) => {
      this.modelCache.set("player", gltf.scene);
    });

    this.gltfLoader.load("/enemies/target/scene.gltf", (gltf) => {
      this.modelCache.set("target", gltf.scene);
    });

    this.gltfLoader.load("/drops/ammo/scene.gltf", (gltf) => {
      this.modelCache.set("ammo", gltf.scene);
    });

    this.gltfLoader.load("/drops/health/scene.glb", (gltf) => {
      this.modelCache.set("health", gltf.scene);
    });
  }
  createLoadingManager() {
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onStart = () => (this.isLoading = true);

    loadingManager.onProgress = (url, loaded, total) => {
      this.loadingScreen.onProgress(url, loaded, total);
    };

    loadingManager.onLoad = () => {
      this.isLoading = false;

      this.map = new Map(this);
      this.skyManager = new SkyManager(this.scene, this.lights[0]);
      this.input = new InputHandler(this);
      this.difficultyManager = new DifficultyManager(this);
      this.player = new Player(this);
      this.hud = new HUD(this);
      this.crosshair = new Crosshair(this);
      this.enemyManager = new EnemyManger(this);
      this.dropManager = new DropManager(this);
      this.bulletManager = new BulletManager(this);
      this.smokeManager = new SmokeManager(this);
      this.hitEffectManager = new HitEffectManager(this);
      this.shatterEffectManager = new ShatterEffectManager(this);
      this.deathScreen = new DeathScreen(this);
      this.pauseScreen = new PauseScreen(this);
      this.dropCollectionEffects = new DropCollectionEffects(this);

      setTimeout(() => {
        this.loadingScreen.onLoadingComplete();

        this.init();
      }, 2000);
    };

    return loadingManager;
  }
  createBouncyMat() {
    const bouncyMat = new CANNON.Material({ restitution: 0.75 });
    this.world.defaultMaterial.restitution = 1;

    this.world.defaultContactMaterial = new CANNON.ContactMaterial(
      bouncyMat,
      this.world.defaultContactMaterial,
      { restitution: 0.5 }
    );

    return bouncyMat;
  }
  checkGameOver() {
    if (this.player.health.current <= 0 && !this.gameOver) {
      this.gameOver = true;
      this.player.playDeathAnimation();

      this.glitchPass.enabled = true;

      setTimeout(() => this.deathScreen.show(), 2000);
    }
  }
  update() {
    this.composer.render();
    this.world.step(this.timeStep, this.delta / 1000, 10);

    this.player.update();
    this.smokeManager.update();
    this.hitEffectManager.update();
    this.shatterEffectManager.update();

    if (this.gameOver || this.isPaused) return;

    this.bulletManager.update();
    this.enemyManager.update();
    this.dropManager.update();
    this.input.update();
    this.crosshair.update();
    this.difficultyManager.update();
    this.hud.update();
    this.dropCollectionEffects.update();

    this.checkGameOver();
  }
  animate(timestamp) {
    this.delta = timestamp - this.lastTime;
    this.delta = Math.min(this.delta, this.maxDelta);

    this.lastTime = timestamp;
    this.timeToNewFrame += this.delta;

    if (this.timeToNewFrame >= this.frameInterval) this.update();

    this.timeToNewFrame -= this.frameInterval;
  }
  pause() {
    if (this.gameOver) return;

    this.isPaused = !this.isPaused;
    this.pauseScreen.toggle();

    if (this.isPaused) this.pauseAudio();
    else this.resumeAudio();
  }
  autoPause() {
    if (!this.isPaused && !this.gameOver) {
      this.wasAutoPaused = true;
      this.isPaused = true;
      this.pauseScreen.show();

      this.pauseAudio();
    }
  }
  resumeAudio() {
    this.player.damageEffect.resumeHeartbeatAudio();
  }
  pauseAudio() {
    this.player.damageEffect.stopHeartbeatAudio();
  }
  hideUI() {
    this.hud.hide();
    this.crosshair.setHidden(true);
  }
}
