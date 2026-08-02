import { Game } from './Game.js';

const canvas = document.getElementById('gameCanvas');
let game = null;

// ─── START GAME ──────────────────────────────────────
function startGame() {
  console.log('🎮 Starting game...');
  
  const startScreen = document.getElementById('startScreen');
  const matchReport = document.getElementById('matchReport');
  
  if (startScreen) startScreen.style.display = 'none';
  if (matchReport) matchReport.style.display = 'none';
  
  const botCount = parseInt(document.getElementById('botCountSelect')?.value || '15');
  const gameMode = document.getElementById('gameModeSelect')?.value || 'standard';
  
  console.log(`🤖 Bots: ${botCount}, Mode: ${gameMode}`);
  
  // Clean up old game if exists
  if (game) {
    game.running = false;
    game = null;
  }
  
  game = new Game(canvas, botCount, gameMode);
  game.init();
  window.game = game;
}

// ─── EVENT LISTENERS ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded');
  
  const startBtn = document.getElementById('startBtn');
  const playAgainBtn = document.getElementById('playAgainBtn2');
  
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
    console.log('✅ Start button bound');
  } else {
    console.error('❌ Start button not found!');
  }
  
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', startGame);
    console.log('✅ Play Again button bound');
  } else {
    console.warn('⚠️ Play Again button not found');
  }
});

// ─── RESIZE ──────────────────────────────────────────
window.addEventListener('resize', () => {
  if (game) {
    game.canvas.width = window.innerWidth;
    game.canvas.height = window.innerHeight;
  }
});

// ─── GAME LOOP ──────────────────────────────────────
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

// Start the loop
requestAnimationFrame(loop);

console.log('🎯 Zone Royale v1.10T – Ready!');