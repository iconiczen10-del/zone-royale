import { CONFIG, ZONE_PHASES } from './config.js';
import { WeaponDefs } from './WeaponDefs.js';
import { Camera } from './Camera.js';
import { InputHandler } from './InputHandler.js';
import { MapGenerator } from './MapGenerator.js';
import { ZoneManager } from './ZoneManager.js';
import { Renderer } from './Renderer.js';
import { UIManager } from '../ui/UIManager.js';
import { SoundManager } from './SoundManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { WeaponActions } from './WeaponActions.js';
import { CombatSystem } from './CombatSystem.js';
import { BotAI } from './BotAI.js';
import { SpawnManager } from './SpawnManager.js';
import { LootSystem } from './LootSystem.js';
import { ChatManager } from './chat/ChatManager.js';
import { PerformanceViewer } from '../ui/PerformanceViewer.js';

export class Game {
  constructor(canvas, botCount, gameMode = 'standard') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.botCount = botCount;
    this.gameMode = gameMode;
    this.running = false;
    this.over = false;
    this.startTime = 0;
    this.elapsed = 0;
    this.aliveCount = botCount + 1;
    this.deathOrder = [];
    this.killFeed = [];
    this.showInventory = false;
    this.currentLeader = null;
    this._prevShrinking = false;

    // Settings
    this.settings = {
      showFPS: false,
    };
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.currentFPS = 60;

    // Ping system
    this.pingTimer = 0;
    this.lastPingTime = -999;
    this.pingPulseStart = 0;
    this.pingPulsePos = { x: 0, y: 0 };
    this.totalPingsSent = 0;

    this.buildings = [];
    this.trees = [];
    this.bushes = [];
    this.crates = [];
    this.lootItems = [];
    this.bullets = [];
    this.particles = [];
    this.bots = [];
    this.player = null;

    this.sound = new SoundManager();
    this.camera = new Camera(canvas);
    this.input = new InputHandler(canvas);
    this.zone = new ZoneManager(CONFIG.MAP_SIZE);
    this.renderer = new Renderer(canvas, this.ctx);
    this.ui = new UIManager();
    this.chatManager = new ChatManager();
    this.perfViewer = new PerformanceViewer(this);
  }

  init() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (!this.sound.ctx) this.sound.init();
    MapGenerator.generate(this);
    SpawnManager.spawnEntities(this);
    this.bindEvents();
    this.ui.setupFPSToggle(this);
    this.running = true;
    this.startTime = performance.now();
    this.lastPingTime = performance.now();
    this.lastFrameTime = performance.now();
    if (this.player) {
      this.player.lastPosition = { x: this.player.x, y: this.player.y };
    }
    this.perfViewer.metrics.gameMode = this.gameMode;
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.ui.toggleInventory(this);
      }
      if (e.key.toLowerCase() === 'r' && this.player.alive) WeaponActions.startReload(this, this.player);
      if (e.key.toLowerCase() === 'f' && this.player.alive) WeaponActions.startHeal(this, this.player);
      if (e.key.toLowerCase() === 'e' && this.player.alive) LootSystem.pickupLoot(this.player, this);
      if (e.key >= '1' && e.key <= '4' && this.player.alive) WeaponActions.switchWeapon(this.player, parseInt(e.key) - 1);
    });
    document.getElementById('playAgainBtn2').addEventListener('click', () => {
      document.getElementById('matchReport').style.display = 'none';
    });
  }

  addKillFeed(killer, victim) {
    this.killFeed.unshift({ killer, victim, time: performance.now() });
    if (this.killFeed.length > 6) this.killFeed.pop();
  }

  endGame(won) {
    this.over = true;
    this.running = false;
    const p = this.player;
    const matchDuration = (performance.now() - this.startTime) / 1000;
    let topBotKills = 0;
    let topBotName = 'None';
    for (const bot of this.bots) {
      if (bot.kills > topBotKills) {
        topBotKills = bot.kills;
        topBotName = bot.name;
      }
    }
    const matchStats = {
      won,
      placement: won ? 1 : (this.deathOrder.indexOf('You') >= 0 ? this.botCount + 1 - this.deathOrder.indexOf('You') : this.aliveCount + 1),
      totalPlayers: this.botCount + 1,
      matchDuration,
      zonePhases: this.zone.phase + 1,
      distanceTravelled: Math.round(p.distanceTravelled),
      gameMode: this.gameMode,
      botCount: this.botCount,
      kills: p.stats.kills,
      damageDealt: p.stats.damageDealt,
      damageTaken: p.stats.damageTaken,
      accuracy: p.stats.shotsFired > 0 ? ((p.stats.shotsHit / p.stats.shotsFired) * 100).toFixed(1) : '0.0',
      shotsFired: p.stats.shotsFired,
      shotsHit: p.stats.shotsHit,
      healsUsed: p.stats.healsUsed,
      favouriteWeapon: this.getFavouriteWeapon(p),
      weaponKills: p.weaponKills,
      pingsReceived: p.pingsReceived,
      timeSpotted: Math.round(p.timeSpotted),
      zoneDamageTaken: p.stats.damageTaken,
      topBotName,
      topBotKills,
      botsAlive: this.aliveCount - 1,
    };
    this.ui.showMatchReport(matchStats);
    this.perfViewer.visible = false;
    this.ui.hidePerfViewer();
  }

  getFavouriteWeapon(player) {
    let bestWeapon = 'None';
    let bestKills = 0;
    for (const [wep, kills] of Object.entries(player.weaponKills)) {
      if (kills > bestKills) {
        bestKills = kills;
        bestWeapon = wep;
      }
    }
    return bestWeapon;
  }

  update(dt) {
    if (!this.running) return;
    this.elapsed = (performance.now() - this.startTime) / 1000;

    // FPS tracking
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    if (delta > 0) {
      this.fpsHistory.push(1000 / delta);
      if (this.fpsHistory.length > 10) this.fpsHistory.shift();
      this.currentFPS = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
    }

    // Update Performance Viewer metrics (every frame)
    this.perfViewer.updateMetrics();

    // Ping system
    if (this.gameMode === 'target' && this.player.alive) {
      const timeSinceLastPing = (now - this.lastPingTime) / 1000;
      let shouldPing = false;
      if (this.lastPingTime < this.startTime + CONFIG.PING_FIRST_DELAY * 1000) {
        if (this.elapsed >= CONFIG.PING_FIRST_DELAY) shouldPing = true;
      } else {
        if (timeSinceLastPing >= CONFIG.PING_INTERVAL) shouldPing = true;
      }
      if (shouldPing) {
        this.lastPingTime = now;
        this.totalPingsSent++;
        this.player.pingsReceived++;
        const targetX = this.player.x;
        const targetY = this.player.y;
        const huntEndTime = now + CONFIG.PING_HUNT_DURATION * 1000;
        for (const bot of this.bots) {
          if (!bot.alive) continue;
          bot.huntTarget = { x: targetX, y: targetY };
          bot.huntEndTime = huntEndTime;
        }
        this.pingPulseStart = now;
        this.pingPulsePos = { x: targetX, y: targetY };
      }
    }

    const p = this.player;
    if (p.alive) {
      let mx = 0, my = 0;
      if (this.input.keys['w'] || this.input.keys['arrowup']) my = -1;
      if (this.input.keys['s'] || this.input.keys['arrowdown']) my = 1;
      if (this.input.keys['a'] || this.input.keys['arrowleft']) mx = -1;
      if (this.input.keys['d'] || this.input.keys['arrowright']) mx = 1;
      if (mx && my) { mx *= 0.707; my *= 0.707; }
      const newX = p.x + mx * p.speed * dt;
      const newY = p.y + my * p.speed * dt;
      if (!CollisionSystem.isBlocked(this, newX, p.y, p.radius)) p.x = newX;
      if (!CollisionSystem.isBlocked(this, p.x, newY, p.radius)) p.y = newY;
      const dx = p.x - p.lastPosition.x;
      const dy = p.y - p.lastPosition.y;
      p.distanceTravelled += Math.sqrt(dx * dx + dy * dy);
      p.lastPosition = { x: p.x, y: p.y };
      p.angle = Math.atan2(this.input.mouse.worldY - p.y, this.input.mouse.worldX - p.x);
      if (this.input.mouse.down) CombatSystem.tryShoot(this, p);
    }

    for (const bot of this.bots) if (bot.alive) BotAI.update(this, bot, dt);

    this.chatManager.update(this);

    if (p.alive && this.gameMode === 'target') {
      let spotted = false;
      for (const bot of this.bots) {
        if (!bot.alive) continue;
        if (bot.ai.state === 'engage' || bot.ai.state === 'chase') {
          if (bot.ai.target === p) { spotted = true; break; }
        }
      }
      if (spotted) p.timeSpotted += dt;
    }

    const allEntities = [p, ...this.bots];
    let maxKills = -1;
    this.currentLeader = null;
    for (const e of allEntities) {
      if (e.alive && e.kills > maxKills) { maxKills = e.kills; this.currentLeader = e; }
    }
    for (const e of allEntities) {
      if (!e.alive) continue;
      if (e.reloading && performance.now() - e.reloadStart >= e.currentWeaponDef.reloadTime) WeaponActions.finishReload(this, e);
      if (e.healing && (performance.now() - e.healStart) / e.healDuration >= 1) { e.hp = Math.min(e.maxHp, e.hp + e.healAmount); e.healing = false; }
      if (e.damageFlash > 0) e.damageFlash--;
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx; b.y += b.vy; b.traveled += Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (b.traveled > b.range) { this.bullets.splice(i, 1); continue; }
      let hitBuilding = false;
      for (const bld of this.buildings) if (b.x >= bld.x && b.x <= bld.x + bld.w && b.y >= bld.y && b.y <= bld.y + bld.h) { hitBuilding = true; break; }
      for (const t of this.trees) if ((b.x - t.x) ** 2 + (b.y - t.y) ** 2 < t.r ** 2) { hitBuilding = true; break; }
      if (hitBuilding) {
        for (let j = 0; j < 3; j++) this.particles.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 10, maxLife: 10, color: '#ffaa00', size: 2 });
        this.bullets.splice(i, 1); continue;
      }
      let hit = false;
      const targets = b.owner.isPlayer ? this.bots : [this.player, ...this.bots.filter(bot => bot !== b.owner)];
      for (const t of targets) { if (!t.alive) continue; if ((t.x - b.x) ** 2 + (t.y - b.y) ** 2 < t.radius ** 2) { CombatSystem.dealDamage(this, t, b.damage, b.owner); hit = true; break; } }
      if (hit) this.bullets.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx; pt.y += pt.vy; pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    this.zone.update(dt);
    if (this.zone.shrinking && !this._prevShrinking) this.sound.play('zone_shrinking');
    this._prevShrinking = this.zone.shrinking;
    this.zone.damageTimer += dt;
    if (this.zone.damageTimer >= 1.0) {
      this.zone.damageTimer -= 1.0;
      for (const e of allEntities) {
        if (!e.alive) continue;
        if (this.zone.isOutside(e)) {
          const dmg = CONFIG.ZONE_DAMAGE_BASE * (1 + this.zone.phase * 0.5);
          e.hp -= dmg; e.damageFlash = 5; e.lastDamageTime = performance.now();
          if (e.isPlayer) { e.stats.damageTaken += dmg; this.sound.play('zone_dmg'); this.sound.play('zone_warning'); }
          if (e.hp <= 0) { e.hp = 0; e.alive = false; this.aliveCount--; this.deathOrder.push(e.name); this.addKillFeed('Zone', e.name);
            if (e.isPlayer) { this.sound.play('death'); this.endGame(false); }
            else this.sound.play('kill');
            if (this.aliveCount <= 1 && this.player.alive) this.endGame(true);
          }
        }
      }
    }

    this.camera.follow(p);
    this.input.updateWorldCoords(this.camera);
    this.killFeed = this.killFeed.filter(kf => performance.now() - kf.time < 6000);
  }

  render() {
    this.renderer.render(this);
  }
}