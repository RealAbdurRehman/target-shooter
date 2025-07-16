export default class LoadingScreen {
  constructor(game) {
    this.game = game;

    this.loadingScreen = document.getElementById("loading-screen");
    this.loadingContainer = document.querySelector(".loading-container");
    this.progressBar = document.getElementById("progress-bar");
    this.loadingPercentage = document.getElementById("loading-percentage");
    this.currentlyLoading = document.getElementById("currently-loading");
    this.loadingHider = document.getElementById("loading-hider");
    this.tipText = document.getElementById("tip-text");

    this.currentTip = 0;
    this.tipDuration = 4000;
    this.tips = [
      "Aim with your mouse, shoot with LMB",
      "Use RMB to aim down sights",
      "Watch for health and ammo drops",
      "Enemies get tougher the further you go",
      "Bullets bounce off surfaces",
      "Reload often to stay ready",
      "Bullets drop over distance — aim accordingly",
    ];

    this.init();
  }
  init() {
    this.startTipRotation();
    this.setupMouseEffects();
  }
  startTipRotation() {
    this.showTip(this.currentTip);

    setInterval(() => {
      this.currentTip = (this.currentTip + 1) % this.tips.length;
      this.showTip(this.currentTip);
    }, this.tipDuration);
  }
  showTip(index) {
    this.tipText.style.animation = "none";
    this.tipText.offsetHeight;
    this.tipText.textContent = this.tips[index];
    this.tipText.style.animation = `fadeTip ${this.tipDuration}ms ease-in-out`;
  }
  setupMouseEffects() {
    document.addEventListener("mousemove", (e) => {
      if (!this.game.isLoading) return;

      const rect = this.loadingContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const rotateX = (mouseY / window.innerHeight) * 20;
      const rotateY = (mouseX / window.innerWidth) * 20;

      this.loadingContainer.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
    });

    document.addEventListener("mouseleave", () => {
      this.loadingContainer.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    });
  }
  onProgress(url, loaded, total) {
    const progress = (loaded / total) * 100;

    this.progressBar.style.width = progress + "%";
    this.loadingPercentage.textContent = Math.floor(progress) + "%";

    const loadingText = document.querySelector(".loading-text");
    loadingText.innerHTML = this.getLoadingText(progress);

    this.currentlyLoading.textContent = `Currently Loading: ${url}`;
  }
  hideLoadingScreen() {
    this.game.isLoading = false;
    this.loadingScreen.classList.add("hidden");
    this.loadingHider.classList.add("hidden");
  }
  onLoadingComplete() {
    this.loadingProgress = 100;
    setTimeout(() => this.hideLoadingScreen(), 300);
  }
  getLoadingText(progress) {
    let text;
    if (progress < 25)
      text = 'Loading Models<span class="loading-dots"></span>';
    else if (progress < 50)
      text = 'Loading Textures<span class="loading-dots"></span>';
    else if (progress < 75)
      text = 'Loading Audio<span class="loading-dots"></span>';
    else if (progress < 95)
      text = 'Initializing Game<span class="loading-dots"></span>';
    else text = "Loaded!";

    return text;
  }
}
