import { CONFIG } from './config.js';
import { WeaponDefs } from './WeaponDefs.js';
import { Player } from './Player.js';
import { Bot } from './Bot.js';
import { CollisionSystem } from './CollisionSystem.js';

const MIN_SPAWN_DIST = 500;

export class SpawnManager {
  static spawnEntities(game) {
    const spawnedPositions = [];

    const tooClose = (x, y) => {
      for (const pos of spawnedPositions) {
        if (Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2) < MIN_SPAWN_DIST) return true;
      }
      return false;
    };

    // ─── PLAYER ─────────────────────────────────────
    let px, py;
    let attempts = 0;
    do {
      px = 300 + Math.random() * (CONFIG.MAP_SIZE - 600);
      py = 300 + Math.random() * (CONFIG.MAP_SIZE - 600);
      attempts++;
      if (attempts > 1000) break;
    } while (CollisionSystem.isBlocked(game, px, py, CONFIG.PLAYER_RADIUS) || tooClose(px, py));
    spawnedPositions.push({ x: px, y: py });
    game.player = new Player(px, py);
    game.player.weapons.push({ type: 'pistol', ammo: 15, reserveAmmo: 30 });
    game.player.currentWeapon = 1;

    // ─── BOTS ──────────────────────────────────────
    game.bots = [];
    for (let i = 0; i < game.botCount; i++) {
      let bx, by;
      attempts = 0;
      do {
        bx = 200 + Math.random() * (CONFIG.MAP_SIZE - 400);
        by = 200 + Math.random() * (CONFIG.MAP_SIZE - 400);
        attempts++;
        if (attempts > 1000) break;
      } while (CollisionSystem.isBlocked(game, bx, by, CONFIG.PLAYER_RADIUS) || tooClose(bx, by));
      spawnedPositions.push({ x: bx, y: by });
      const bot = new Bot(bx, by, `Bot_${String(i + 1).padStart(2, '0')}`);
      const wTypes = ['pistol', 'shotgun', 'rifle', 'sniper', 'shotgunPro'];
      const wt = wTypes[Math.floor(Math.random() * wTypes.length)];
      bot.weapons.push({ type: wt, ammo: WeaponDefs[wt].ammoMax, reserveAmmo: WeaponDefs[wt].ammoMax * 3 });
      bot.currentWeapon = 1;
      if (Math.random() < 0.3) bot.armor = 50;
      game.bots.push(bot);
    }

    // ─── DOZX TOWN LOOT (already spawned in MapGenerator) ───
    // No additional spawn needed – loot is placed in MapGenerator.generateDOZXTown()
  }
}