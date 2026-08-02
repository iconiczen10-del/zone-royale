import { CONFIG } from './config.js';
import { WeaponDefs } from './WeaponDefs.js';
import { CollisionSystem } from './CollisionSystem.js';
import { LootSystem } from './LootSystem.js';
import { CombatSystem } from './CombatSystem.js';
import { WeaponActions } from './WeaponActions.js';

export class BotAI {
  static update(game, bot, dt) {
    if (!bot.alive) return;
    const ai = bot.ai;
    ai.stateTimer -= dt;
    ai.shootCooldown -= dt;
    const distFromZoneCenter = Math.sqrt((bot.x - game.zone.cx) ** 2 + (bot.y - game.zone.cy) ** 2);
    const outsideZone = distFromZoneCenter > game.zone.currentRadius;
    const lowHp = bot.hp < 30;

    // ─── HUNT MODE OVERRIDE ──────────────────────
    if (bot.huntEndTime && performance.now() < bot.huntEndTime && bot.huntTarget) {
      const ht = bot.huntTarget;
      const dx = ht.x - bot.x;
      const dy = ht.y - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 30) {
        const moveX = dx / dist;
        const moveY = dy / dist;
        bot.angle = Math.atan2(dy, dx);
        const newX = bot.x + moveX * bot.speed * dt;
        const newY = bot.y + moveY * bot.speed * dt;
        if (!CollisionSystem.isBlocked(game, newX, bot.y, bot.radius)) bot.x = newX;
        else ai.wanderAngle = Math.random() * Math.PI * 2;
        if (!CollisionSystem.isBlocked(game, bot.x, newY, bot.radius)) bot.y = newY;
        else ai.wanderAngle = Math.random() * Math.PI * 2;
      }

      if (game.player.alive && !CollisionSystem.lineHitsBuilding(game, bot.x, bot.y, game.player.x, game.player.y)) {
        const playerDist = CollisionSystem.dist(bot, game.player);
        const weaponRange = WeaponDefs[bot.currentWeaponData.type]?.range || 0;
        if (playerDist < weaponRange && ai.shootCooldown <= 0 && !bot.reloading) {
          bot.angle = Math.atan2(game.player.y - bot.y, game.player.x - bot.x);
          CombatSystem.tryShoot(game, bot);
          ai.shootCooldown = 0.2 / ai.accuracy;
        }
      }
      if (bot.currentWeaponData?.ammo === 0 && !bot.reloading) WeaponActions.startReload(game, bot);
      return;
    } else {
      bot.huntTarget = null;
      bot.huntEndTime = null;
    }

    // ─── NORMAL AI ────────────────────────────────
    BotAI.autoPickupBot(game, bot);

    if (lowHp && ai.state !== 'engage' && ai.state !== 'chase') {
      if (performance.now() - bot.lastDamageTime > 2500 && !bot.healing) WeaponActions.startHeal(game, bot);
    }

    // ─── TARGET SELECTION ─────────────────────────
    let nearestEnemy = null;
    let nearestDist = ai.visionRange;

    const playerVisible = game.player.alive && !CollisionSystem.lineHitsBuilding(game, bot.x, bot.y, game.player.x, game.player.y);
    const playerDist = playerVisible ? CollisionSystem.dist(bot, game.player) : Infinity;

    for (const other of game.bots) {
      if (other === bot || !other.alive) continue;
      if (!CollisionSystem.lineHitsBuilding(game, bot.x, bot.y, other.x, other.y)) {
        const d = CollisionSystem.dist(bot, other);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = other;
        }
      }
    }

    if (game.gameMode === 'target' && playerVisible) {
      if (Math.random() < CONFIG.TARGET_MODE_PROBABILITY) {
        nearestEnemy = game.player;
        nearestDist = playerDist;
      }
    }

    if (!nearestEnemy && playerVisible) {
      nearestEnemy = game.player;
      nearestDist = playerDist;
    } else if (playerVisible && playerDist < nearestDist) {
      nearestEnemy = game.player;
      nearestDist = playerDist;
    }

    // ─── STATE TRANSITIONS ────────────────────────
    if (outsideZone && (bot.hp < 60 || game.zone.shrinking)) {
      ai.state = 'flee_zone';
    } else if (nearestEnemy && nearestDist < ai.visionRange) {
      const wType = bot.currentWeaponData.type;
      let engageDist;
      switch (wType) {
        case 'shotgunPro': engageDist = 80; break;
        case 'shotgun': engageDist = 120; break;
        case 'sniper': engageDist = 400; break;
        case 'rifle': engageDist = 300; break;
        case 'pistol': engageDist = 200; break;
        default: engageDist = WeaponDefs[wType]?.range * 0.9 || 100;
      }
      ai.state = (nearestDist < engageDist) ? 'engage' : 'chase';
      ai.target = nearestEnemy;
    } else if (ai.state === 'engage' || ai.state === 'chase') {
      ai.state = 'wander';
      ai.target = null;
    }

    // ─── WANDER (natural, no town attraction) ────
    if (ai.state === 'wander') {
      const hasWeapon = bot.weapons.some(w => w.type !== 'fists');
      if (!hasWeapon || bot.currentWeaponData?.ammo === 0) {
        let nearestLoot = null,
          nearestLootDist = 400;
        for (const item of game.lootItems) {
          if (item.type === 'weapon' || item.type === 'ammo') {
            const d = Math.sqrt((bot.x - item.x) ** 2 + (bot.y - item.y) ** 2);
            if (d < nearestLootDist) { nearestLootDist = d;
              nearestLoot = item; }
          }
        }
        for (const crate of game.crates) {
          if (!crate.opened) {
            const d = Math.sqrt((bot.x - crate.x) ** 2 + (bot.y - crate.y) ** 2);
            if (d < nearestLootDist) { nearestLootDist = d;
              nearestLoot = crate; }
          }
        }
        if (nearestLoot) { ai.state = 'loot';
          ai.target = nearestLoot; }
      } else if (game.gameMode === 'target' && game.player.alive) {
        // Natural player search bias (subtle, not town)
        const dx = game.player.x - bot.x;
        const dy = game.player.y - bot.y;
        const playerAngle = Math.atan2(dy, dx);
        ai.wanderTimer -= dt;
        if (ai.wanderTimer <= 0) {
          ai.wanderAngle = (Math.random() * Math.PI * 2) * 0.8 + playerAngle * 0.2;
          ai.wanderTimer = 2 + Math.random() * 3;
        }
      }
    }

    // ─── SHOTGUN PRO SMART AI ─────────────────────
    if (bot.currentWeaponData.type === 'shotgunPro' && ai.state === 'engage' && ai.target && ai.target.alive) {
      const dx = ai.target.x - bot.x;
      const dy = ai.target.y - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 120) {
        const moveX = dx / dist;
        const moveY = dy / dist;
        bot.x += moveX * bot.speed * dt * 1.2;
        bot.y += moveY * bot.speed * dt * 1.2;
        if (Math.sin(performance.now() / 200) > 0) {
          bot.x += Math.cos(bot.angle + Math.PI / 2) * 20 * dt;
        } else {
          bot.x -= Math.cos(bot.angle + Math.PI / 2) * 20 * dt;
        }
        bot.angle = Math.atan2(dy, dx);
      } else if (dist > 30) {
        const strafeAngle = bot.angle + Math.PI / 2 * (Math.sin(performance.now() / 300 + bot.x) > 0 ? 1 : -1);
        bot.x += Math.cos(strafeAngle) * 30 * dt;
        bot.y += Math.sin(strafeAngle) * 30 * dt;
        bot.angle = Math.atan2(dy, dx);
        if (ai.shootCooldown <= 0) {
          CombatSystem.tryShoot(game, bot);
          ai.shootCooldown = 0.1;
        }
      } else {
        const moveX = -dx / dist;
        const moveY = -dy / dist;
        bot.x += moveX * bot.speed * dt * 0.5;
        bot.y += moveY * bot.speed * dt * 0.5;
        bot.angle = Math.atan2(dy, dx);
        if (ai.shootCooldown <= 0) {
          CombatSystem.tryShoot(game, bot);
          ai.shootCooldown = 0.15;
        }
      }
      if (bot.currentWeaponData?.ammo === 0 && !bot.reloading) WeaponActions.startReload(game, bot);
      return;
    }

    // ─── MOVEMENT ──────────────────────────────────
    let moveX = 0,
      moveY = 0;
    switch (ai.state) {
      case 'wander':
        if (game.gameMode !== 'target' || !game.player.alive) {
          ai.wanderTimer -= dt;
          if (ai.wanderTimer <= 0) { ai.wanderAngle = Math.random() * Math.PI * 2;
            ai.wanderTimer = 2 + Math.random() * 3; }
        }
        moveX = Math.cos(ai.wanderAngle);
        moveY = Math.sin(ai.wanderAngle);
        bot.angle = ai.wanderAngle;
        break;
      case 'loot':
        if (ai.target) {
          const dx = ai.target.x - bot.x,
            dy = ai.target.y - bot.y,
            d = Math.sqrt(dx * dx + dy * dy);
          if (d > 30) { moveX = dx / d;
            moveY = dy / d;
            bot.angle = Math.atan2(dy, dx); } else { LootSystem.pickupLoot(bot, game);
            ai.state = 'wander';
            ai.target = null; }
        } else ai.state = 'wander';
        break;
      case 'chase':
        if (ai.target && ai.target.alive) {
          const dx = ai.target.x - bot.x,
            dy = ai.target.y - bot.y,
            d = Math.sqrt(dx * dx + dy * dy);
          moveX = dx / d;
          moveY = dy / d;
          bot.angle = Math.atan2(dy, dx);
          if (d < WeaponDefs[bot.currentWeaponData.type]?.range * 0.8 && ai.shootCooldown <= 0) {
            CombatSystem.tryShoot(game, bot);
            ai.shootCooldown = 0.3 / ai.accuracy;
          }
        } else { ai.state = 'wander';
          ai.target = null; }
        break;
      case 'engage':
        if (ai.target && ai.target.alive) {
          const dx = ai.target.x - bot.x,
            dy = ai.target.y - bot.y,
            d = Math.sqrt(dx * dx + dy * dy);
          bot.angle = Math.atan2(dy, dx);
          const strafe = bot.angle + Math.PI / 2 * (Math.sin(performance.now() / 800 + bot.x) > 0 ? 1 : -1);
          moveX = Math.cos(strafe) * 0.3;
          moveY = Math.sin(strafe) * 0.3;
          const wType = bot.currentWeaponData.type;
          const ideal = wType === 'shotgun' || wType === 'shotgunPro' ? 80 : wType === 'sniper' ? 350 : 200;
          if (d > ideal + 50) { moveX += dx / d * 0.5;
            moveY += dy / d * 0.5; } else if (d < ideal - 50) { moveX -= dx / d * 0.5;
            moveY -= dy / d * 0.5; }
          if (ai.shootCooldown <= 0 && !bot.reloading) { CombatSystem.tryShoot(game, bot);
            ai.shootCooldown = 0.2 / ai.accuracy; }
          if (bot.currentWeaponData?.ammo === 0 && !bot.reloading) WeaponActions.startReload(game, bot);
        } else { ai.state = 'wander';
          ai.target = null; }
        break;
      case 'flee_zone':
        const zdx = game.zone.nextCx - bot.x,
          zdy = game.zone.nextCy - bot.y,
          zd = Math.sqrt(zdx * zdx + zdy * zdy);
        if (zd > 20) { moveX = zdx / zd;
          moveY = zdy / zd;
          bot.angle = Math.atan2(zdy, zdx); }
        if (nearestEnemy && nearestDist < 150 && ai.shootCooldown <= 0) {
          bot.angle = Math.atan2(nearestEnemy.y - bot.y, nearestEnemy.x - bot.x);
          CombatSystem.tryShoot(game, bot);
          ai.shootCooldown = 0.4;
        }
        if (distFromZoneCenter < game.zone.currentRadius - 20) ai.state = 'wander';
        break;
    }

    const newX = bot.x + moveX * bot.speed * dt;
    const newY = bot.y + moveY * bot.speed * dt;
    if (!CollisionSystem.isBlocked(game, newX, bot.y, bot.radius)) bot.x = newX;
    else ai.wanderAngle = Math.random() * Math.PI * 2;
    if (!CollisionSystem.isBlocked(game, bot.x, newY, bot.radius)) bot.y = newY;
    else ai.wanderAngle = Math.random() * Math.PI * 2;
  }

  static autoPickupBot(game, bot) {
    if (bot.huntEndTime && performance.now() < bot.huntEndTime) return;

    const range = 40;
    for (let i = game.lootItems.length - 1; i >= 0; i--) {
      const item = game.lootItems[i];
      if ((bot.x - item.x) ** 2 + (bot.y - item.y) ** 2 < range * range) {
        if (item.type === 'weapon') {
          const exist = bot.weapons.find(w => w.type === item.subtype);
          if (!exist && bot.weapons.length < 4) {
            bot.weapons.push({ type: item.subtype, ammo: WeaponDefs[item.subtype].ammoMax, reserveAmmo: WeaponDefs[item.subtype].ammoMax * 2 });
            if (bot.currentWeaponDef.name === 'Fists') bot.currentWeapon = bot.weapons.length - 1;
            game.lootItems.splice(i, 1);
          } else if (exist) { exist.reserveAmmo += WeaponDefs[item.subtype].ammoMax;
            game.lootItems.splice(i, 1); }
        } else if (item.type === 'heal') {
          if (item.subtype === 'bandage') bot.bandages += 2;
          else bot.medkits += 1;
          game.lootItems.splice(i, 1);
        } else if (item.type === 'armor') {
          bot.armor = Math.min(bot.maxArmor, bot.armor + 50);
          game.lootItems.splice(i, 1);
        } else if (item.type === 'ammo') {
          for (const w of bot.weapons) { if (w.reserveAmmo !== Infinity) w.reserveAmmo += WeaponDefs[w.type].ammoMax; }
          game.lootItems.splice(i, 1);
        }
      }
    }
    for (const crate of game.crates) {
      if (!crate.opened && (bot.x - crate.x) ** 2 + (bot.y - crate.y) ** 2 < 45 * 45) {
        crate.opened = true;
        game.lootItems.push(...LootSystem.generateCrateLoot(crate));
        game.sound.play('crate_open', crate.x, crate.y, game.camera.x, game.camera.y);
      }
    }
  }
}