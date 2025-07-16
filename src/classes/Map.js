import * as THREE from "three";
import * as CANNON from "cannon-es";
import enableObjectShadow from "../utils/enableObjectShadow.js";

export default class Map {
  constructor(game) {
    this.game = game;

    this.group = new THREE.Group();
    this.mapOffset = new THREE.Vector3(0, -5.5, -28.5);

    this.mapObjects = [];
    this.physicsObjects = [];

    this.createMap();
  }
  init() {
    this.group.position.copy(this.mapOffset);
    this.game.scene.add(this.group);
  }
  createMap() {
    this.createGround();
    this.createWalls();
    this.createCeiling();
    this.createTargetBackdrops();
    this.createPillars();
    this.createEquipmentRacks();
    this.createDecorations();

    this.init();
  }
  createPhysicsBody(
    shape,
    position,
    type = CANNON.Body.STATIC,
    quaternion = new CANNON.Quaternion()
  ) {
    const adjustedPosition = new CANNON.Vec3(
      position.x + this.mapOffset.x,
      position.y + this.mapOffset.y,
      position.z + this.mapOffset.z
    );

    const body = new CANNON.Body({
      shape,
      type,
      quaternion,
      position: adjustedPosition,
    });

    this.game.world.addBody(body);
    this.physicsObjects.push(body);
    return body;
  }
  createGround() {
    const floorGeometry = new THREE.BoxGeometry(50, 0.1, 80);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.1,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.1;
    enableObjectShadow(floor);

    this.group.add(floor);
    this.mapObjects.push(floor);

    this.createPhysicsBody(
      new CANNON.Box(new CANNON.Vec3(25, 0.05, 40)),
      new THREE.Vector3(0, -0.1, 0)
    );

    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;

      const laneX = i * 8;

      const stripGeometry = new THREE.BoxGeometry(0.2, 0.05, 60);
      const stripMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        roughness: 0.3,
      });

      const strip = new THREE.Mesh(stripGeometry, stripMaterial);
      strip.position.set(laneX, 0, 10);
      enableObjectShadow(strip);

      this.group.add(strip);
      this.mapObjects.push(strip);

      this.createPhysicsBody(
        new CANNON.Box(new CANNON.Vec3(0.1, 0.025, 30)),
        new THREE.Vector3(laneX, 0, 10)
      );

      const shootingPad = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.1, 3),
        new THREE.MeshStandardMaterial({
          color: 0x4a4a4a,
          roughness: 0.4,
        })
      );
      shootingPad.position.set(laneX, 0.05, 32);
      enableObjectShadow(shootingPad);
      this.group.add(shootingPad);
      this.mapObjects.push(shootingPad);

      this.createPhysicsBody(
        new CANNON.Box(new CANNON.Vec3(3, 0.05, 1.5)),
        new THREE.Vector3(laneX, 0.05, 32)
      );
    }
  }
  createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      roughness: 0.7,
      metalness: 0.2,
    });

    const backWallUpper = new THREE.Mesh(
      new THREE.BoxGeometry(50, 4, 1),
      wallMaterial
    );
    backWallUpper.position.set(0, 14, -30);
    enableObjectShadow(backWallUpper);
    this.group.add(backWallUpper);
    this.mapObjects.push(backWallUpper);

    this.createPhysicsBody(
      new CANNON.Box(new CANNON.Vec3(25, 2, 0.5)),
      new THREE.Vector3(0, 14, -30)
    );

    const backWallLower = new THREE.Mesh(
      new THREE.BoxGeometry(50, 6, 1),
      wallMaterial
    );
    backWallLower.position.set(0, 3, -30);
    enableObjectShadow(backWallLower);
    this.group.add(backWallLower);
    this.mapObjects.push(backWallLower);

    this.createPhysicsBody(
      new CANNON.Box(new CANNON.Vec3(25, 3, 0.5)),
      new THREE.Vector3(0, 3, -30)
    );

    for (let i = -2; i <= 2; i++) {
      const laneX = i * 12;

      const pillarGeometry = new THREE.BoxGeometry(1, 6, 1);
      const pillar = new THREE.Mesh(pillarGeometry, wallMaterial);
      pillar.position.set(laneX, 9, -30);
      enableObjectShadow(pillar);

      this.group.add(pillar);
      this.mapObjects.push(pillar);

      this.createPhysicsBody(
        new CANNON.Box(new CANNON.Vec3(0.5, 3, 0.5)),
        new THREE.Vector3(laneX, 9, -30)
      );
    }

    const sideWalls = [
      { x: -25, z: 0, y: 1, rotY: 0 },
      { x: 25, z: 0, y: 1, rotY: 0 },
    ];

    sideWalls.forEach((wall) => {
      const sideWall = new THREE.Mesh(
        new THREE.BoxGeometry(1, 4, 80),
        wallMaterial
      );
      sideWall.position.set(wall.x, wall.y, wall.z);
      enableObjectShadow(sideWall);
      this.group.add(sideWall);
      this.mapObjects.push(sideWall);

      this.createPhysicsBody(
        new CANNON.Box(new CANNON.Vec3(0.5, 2.5, 40)),
        new THREE.Vector3(wall.x, wall.y, wall.z)
      );
    });

    const frontBarrier = new THREE.Mesh(
      new THREE.BoxGeometry(40, 1.25, 1),
      new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.8,
      })
    );
    frontBarrier.position.set(0, 0.75, 35);
    enableObjectShadow(frontBarrier);
    this.group.add(frontBarrier);
    this.mapObjects.push(frontBarrier);

    this.createPhysicsBody(
      new CANNON.Box(new CANNON.Vec3(20, 0.75, 0.5)),
      new THREE.Vector3(0, 0.75, 35)
    );
  }
  createCeiling() {
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.8,
    });

    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.5, 60),
      ceilingMaterial
    );
    ceiling.position.y = 16;
    enableObjectShadow(ceiling);
    this.group.add(ceiling);
    this.mapObjects.push(ceiling);

    this.createPhysicsBody(
      new CANNON.Box(new CANNON.Vec3(25, 0.25, 30)),
      new THREE.Vector3(0, 16, 0)
    );

    for (let i = -20; i <= 20; i += 5) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.5, 60),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      );
      beam.position.set(i, 15.5, 0);
      enableObjectShadow(beam);

      this.group.add(beam);
      this.mapObjects.push(beam);

      this.createPhysicsBody(
        new CANNON.Box(new CANNON.Vec3(0.5, 0.25, 30)),
        new THREE.Vector3(i, 15.5, 0)
      );
    }
  }
  createTargetBackdrops() {
    const distances = [-20, -25, -30];

    distances.forEach((distance) => {
      for (let i = -2; i <= 2; i++) {
        const laneX = i * 8;

        const backdrop = new THREE.Mesh(
          new THREE.BoxGeometry(6, 4, 0.5),
          new THREE.MeshStandardMaterial({
            color: 0x8b6f47,
            roughness: 0.8,
          })
        );
        backdrop.position.set(laneX, 2, distance);
        enableObjectShadow(backdrop);
        this.group.add(backdrop);
        this.mapObjects.push(backdrop);

        this.createPhysicsBody(
          new CANNON.Box(new CANNON.Vec3(3, 2, 0.25)),
          new THREE.Vector3(laneX, 2, distance)
        );

        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(3, 3, 0.2),
          new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
          })
        );
        frame.position.set(laneX, 2, distance + 0.3);
        enableObjectShadow(frame);
        this.group.add(frame);
        this.mapObjects.push(frame);

        this.createPhysicsBody(
          new CANNON.Box(new CANNON.Vec3(1.5, 1.5, 0.1)),
          new THREE.Vector3(laneX, 2, distance + 0.3)
        );
      }
    });
  }
  createPillars() {
    const pillarPositions = [
      { x: -20, z: -10 },
      { x: 20, z: -10 },
      { x: -20, z: 10 },
      { x: 20, z: 10 },
    ];

    pillarPositions.forEach((pos) => {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(2, 16, 2),
        new THREE.MeshStandardMaterial({
          color: 0x555555,
          roughness: 0.7,
          metalness: 0.3,
        })
      );
      pillar.position.set(pos.x, 8, pos.z);
      enableObjectShadow(pillar);
      this.group.add(pillar);
      this.mapObjects.push(pillar);

      this.createPhysicsBody(
        new CANNON.Box(new CANNON.Vec3(1, 8, 1)),
        new THREE.Vector3(pos.x, 8, pos.z)
      );
    });
  }
  createEquipmentRacks() {
    const rackPositions = [
      { x: -22, z: 25 },
      { x: -18, z: 15 },
      { x: -20, z: 5 },
      { x: -21, z: -15 },
      { x: 22, z: 20 },
      { x: 22, z: 25 },
      { x: 20, z: 5 },
      { x: 19, z: -5 },
    ];

    rackPositions.forEach((pos) => {
      const angle = Math.random() * Math.PI * 2;
      const quat = new CANNON.Quaternion().setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        angle
      );

      const rack = new THREE.Mesh(
        new THREE.BoxGeometry(2, 4, 1),
        new THREE.MeshStandardMaterial({
          color: 0x654321,
          roughness: 0.8,
        })
      );
      rack.position.set(pos.x, 2, pos.z);
      rack.quaternion.copy(quat);
      enableObjectShadow(rack);
      this.group.add(rack);
      this.mapObjects.push(rack);

      this.createPhysicsBody(
        new CANNON.Box(new CANNON.Vec3(1, 2, 0.5)),
        new THREE.Vector3(pos.x, 2, pos.z),
        CANNON.Body.STATIC,
        quat
      );
    });

    const ammoBoxes = [
      { x: -18, z: 28 },
      { x: -15, z: 28 },
      { x: -17.5, z: 10 },
      { x: -21, z: -2 },
      { x: 15, z: 28 },
      { x: 18, z: 28 },
      { x: 16, z: 20 },
      { x: 21, z: -2 },
    ];

    ammoBoxes.forEach((pos) => {
      const angle = Math.random() * Math.PI * 2;
      const quat = new CANNON.Quaternion().setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        angle
      );

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1, 1.5),
        new THREE.MeshStandardMaterial({
          color: 0x2d4a2d,
          roughness: 0.7,
        })
      );
      box.position.set(pos.x, 0.5, pos.z);
      box.quaternion.copy(quat);
      enableObjectShadow(box);
      this.group.add(box);
      this.mapObjects.push(box);

      this.createPhysicsBody(
        new CANNON.Box(new CANNON.Vec3(1, 0.5, 0.75)),
        new THREE.Vector3(pos.x, 0.5, pos.z),
        CANNON.Body.STATIC,
        quat
      );
    });
  }
  createDecorations() {
    for (let i = -15; i <= 15; i += 15) {
      const light = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.25, 1),
        new THREE.MeshStandardMaterial({
          color: 0x666666,
          roughness: 0.3,
          metalness: 0.7,
        })
      );
      light.position.set(i, 15.25, 0);
      this.group.add(light);
      this.mapObjects.push(light);

      this.createPhysicsBody(
        new CANNON.Box(new CANNON.Vec3(1.5, 0.625, 0.5)),
        new THREE.Vector3(i, 15.25, 0)
      );

      const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(2.75, 0.25, 0.75),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
        })
      );
      lightPanel.position.set(i, 14.65, 0);
      this.group.add(lightPanel);

      const lightSource = new THREE.PointLight(0xffffff, 300, 50);
      lightSource.position.set(i, 10, 0);
      this.group.add(lightSource);
    }
  }
}
