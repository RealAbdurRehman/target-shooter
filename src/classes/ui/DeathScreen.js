export default class DeathScreen {
  constructor(game) {
    this.game = game;

    this.deathScreen = document.getElementById("death-screen");
    this.restartButton = document.getElementById("restart-death");
    this.finalAccuracy = document.getElementById("final-accuracy");
    this.finalScore = document.getElementById("final-score");
    this.deathMessage = document.querySelector(".death-message");
    this.rankValue = document.querySelector(".rank-value");

    this.deathMessages = [
      "Better luck next time!",
      "Maybe try again?",
      "Practice makes perfect!",
      "Maybe try to beat your high score?",
    ];

    this.rankSystem = {
      ranks: [
        { name: "Newbie", minScore: 0, color: "#777" },
        { name: "Average", minScore: 150, color: "#2E8B57" },
        { name: "Master", minScore: 500, color: "#592e8bff" },
        { name: "Elite", minScore: 750, color: "#DAA520" },
        { name: "Veteran", minScore: 1250, color: "#B22222" },
        { name: "Legend", minScore: 2000, color: "#1E90FF" },
      ],
    };

    this.addListeners();
  }
  addListeners() {
    this.restartButton.addEventListener("click", () => {
      window.location.reload();
    });
  }
  getRankFromScore(score) {
    let currentRank = this.rankSystem.ranks[0];

    for (let i = this.rankSystem.ranks.length - 1; i >= 0; i--) {
      if (score >= this.rankSystem.ranks[i].minScore) {
        currentRank = this.rankSystem.ranks[i];
        break;
      }
    }

    return currentRank;
  }
  getRandomDeathMessage() {
    const randomIndex = Math.floor(Math.random() * this.deathMessages.length);
    return this.deathMessages[randomIndex];
  }
  calculateBonusScore() {
    const accuracy = this.game.player.getAccuracy();
    const baseScore = this.game.player.score.current;
    const difficultyLevel = this.game.difficultyManager.difficultyLevel;
    const gameTime = this.game.difficultyManager.currentGameTime / 1000;

    const accuracyBonus = Math.floor(baseScore * (accuracy / 100) * 0.5);
    const difficultyBonus = Math.floor(baseScore * (difficultyLevel * 0.05));
    const timeBonus = Math.floor(gameTime / 10);

    const totalBonus = accuracyBonus + difficultyBonus + timeBonus;

    return {
      base: baseScore,
      accuracy: accuracyBonus,
      difficulty: difficultyBonus,
      time: timeBonus,
      total: baseScore + totalBonus,
    };
  }
  displayRank(score) {
    const rank = this.getRankFromScore(score);
    this.rankValue.style.color = rank.color;
    this.rankValue.offsetWidth;
    this.rankValue.classList.add("rank-appear");
  }
  updateStats() {
    const accuracy = Math.round(this.game.player.getAccuracy());
    const scoreBreakdown = this.calculateBonusScore();

    this.finalAccuracy.textContent = `${accuracy}%`;
    this.finalScore.textContent = `${scoreBreakdown.total}`;

    const rank = this.getRankFromScore(scoreBreakdown.total);
    this.rankValue.textContent = rank.name;
    this.rankValue.style.color = rank.color;
    this.rankValue.style.textShadow = `0 0 10px ${rank.color}`;

    this.deathMessage.textContent = this.getRandomDeathMessage();

    return scoreBreakdown;
  }
  show() {
    const scoreBreakdown = this.updateStats();

    this.deathScreen.style.display = "block";
    this.deathScreen.offsetHeight;
    this.deathScreen.classList.add("visible");
    this.deathScreen.style.opacity = "1";

    this.displayRank(scoreBreakdown.total);
  }
}
