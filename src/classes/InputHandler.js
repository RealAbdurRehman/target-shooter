import * as THREE from "three";

const MOUSE_BUTTON = Object.freeze({
  LEFT: 0,
  RIGHT: 2,
});

export default class InputHandler {
  constructor(game) {
    this.game = game;

    this.keys = [];
    this.mouse = {
      pos: new THREE.Vector2(),
      crossHairPos: new THREE.Vector2(),
      leftClick: {
        previous: false,
        current: false,
      },
      rightClick: {
        previous: false,
        current: false,
      },
    };

    this.init();
  }
  init() {
    window.addEventListener("mousemove", this.updatePos.bind(this));
    window.addEventListener("mousedown", this.onMousedown.bind(this));
    window.addEventListener("mouseup", this.onMouseup.bind(this));
    window.addEventListener("contextmenu", this.preventContextMenu.bind(this));
    window.addEventListener("keydown", this.onKeydown.bind(this));
    window.addEventListener("keyup", this.onKeyup.bind(this));
  }
  updatePos(event) {
    const x = event.clientX;
    const normX = (event.clientX / window.innerWidth) * 2 - 1;

    const y = event.clientY;
    const normY = -(event.clientY / window.innerHeight) * 2 + 1;

    this.mouse.crossHairPos.set(x, y);
    this.mouse.pos.set(normX, normY);
  }
  onMousedown({ button }) {
    if (button === MOUSE_BUTTON.LEFT) this.mouse.leftClick.current = true;
    else if (button === MOUSE_BUTTON.RIGHT)
      this.mouse.rightClick.current = true;
  }
  onMouseup({ button }) {
    if (button === MOUSE_BUTTON.LEFT) this.mouse.leftClick.current = false;
    else if (button === MOUSE_BUTTON.RIGHT)
      this.mouse.rightClick.current = false;
  }
  preventContextMenu(event) {
    event.preventDefault();
  }
  onKeydown({ code }) {
    if (code === "KeyR" && !this.keys.includes(code)) this.keys.push(code);
  }
  onKeyup({ code }) {
    if (code === "KeyP") this.game.pause();
    else if (code === "KeyR") this.keys.splice(this.keys.indexOf(code), 1);
  }
  update() {
    this.mouse.leftClick.previous = this.mouse.leftClick.current;
  }
}
