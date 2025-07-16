export default class DifficultyNotification {
  constructor() {
    this.notification = document.getElementById("difficulty-notification");
    this.levelElement = document.getElementById("difficulty-level");
    this.isShowing = false;
  }
  show(level) {
    if (this.isShowing) return;

    this.isShowing = true;
    this.levelElement.textContent = level;

    this.notification.classList.add("show", "slide-in");
    this.notification.classList.remove("slide-out");

    setTimeout(() => this.hide(), 3000);
  }
  hide() {
    if (!this.isShowing) return;

    this.notification.classList.add("slide-out");
    this.notification.classList.remove("show", "slide-in");

    setTimeout(() => {
      this.notification.classList.remove("slide-out");
      this.isShowing = false;
    }, 400);
  }
}
