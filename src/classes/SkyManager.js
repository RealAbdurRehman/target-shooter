import * as THREE from "three";
import { Sky } from "three/examples/jsm/Addons.js";

export default class SkyManager {
  constructor(scene, directionalLight = null) {
    this.scene = scene;
    this.directionalLight = directionalLight;

    this.sky = null;
    this.skyUniforms = null;
    this.sun = new THREE.Vector3();

    this.skyConfig = {
      turbidity: 0.4,
      rayleigh: 0.3,
      mieCoefficient: 0.002,
      mieDirectionalG: 0.9,
      elevation: 30,
      azimuth: Math.random() > 0.5 ? 210 : 150,
    };

    this.init();
  }
  init() {
    this.sky = new Sky();
    this.sky.scale.setScalar(450000);
    this.scene.add(this.sky);

    this.skyUniforms = this.sky.material.uniforms;

    this.updateSky();
  }
  updateSky() {
    this.skyUniforms["turbidity"].value = this.skyConfig.turbidity;
    this.skyUniforms["rayleigh"].value = this.skyConfig.rayleigh;
    this.skyUniforms["mieCoefficient"].value = this.skyConfig.mieCoefficient;
    this.skyUniforms["mieDirectionalG"].value = this.skyConfig.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - this.skyConfig.elevation);
    const theta = THREE.MathUtils.degToRad(this.skyConfig.azimuth);

    this.sun.setFromSphericalCoords(1, phi, theta);
    this.skyUniforms["sunPosition"].value.copy(this.sun);

    this.updateDirectionalLight();
  }
  updateDirectionalLight() {
    if (!this.directionalLight) return;

    this.directionalLight.position.copy(this.sun).multiplyScalar(100);
    this.directionalLight.lookAt(0, 0, 0);

    this.directionalLight.color.setHex(0xffffff);
  }
}
