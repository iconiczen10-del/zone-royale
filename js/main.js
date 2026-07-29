import { Game } from './Game.js';

const canvas = document.getElementById('gameCanvas');
let game = null;

function startGame() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('matchReport').style.display = 'none';
  const botCount = parseInt(document.getElementById('botCountSelect').value);
  const gameMode = document.getElementById('gameModeSelect').value;
  game = new Game(canvas, botCount, gameMode);
  game.init();
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('playAgainBtn2').addEventListener('click', startGame); // match report replay

window.addEventListener('resize', () => {
  if (game) {
    game.canvas.width = window.innerWidth;
    game.canvas.height = window.innerHeight;
  }
});

let lastTime = 0;
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  if (game && game.running) {
    game.update(dt);
    game.render();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);