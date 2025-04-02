export class Leaderboard {
  static saveScore(score, playerName) {
    const scores = this.getScores();
    scores.push({ score, playerName, date: new Date() });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('highScores', JSON.stringify(scores.slice(0, 10)));
  }

  static getScores() {
    return JSON.parse(localStorage.getItem('highScores') || '[]');
  }
} 