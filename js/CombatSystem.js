import { WeaponActions } from './WeaponActions.js';
import { WeaponDefs } from './WeaponDefs.js';
import { LootSystem } from './LootSystem.js';

export class CombatSystem {
  static tryShoot(game, entity) {
    const now = performance.now();
    if (entity.reloading || entity.healing) return;
    const w = entity.currentWeaponData;
    const def = entity.currentWeaponDef;
    if (now - entity.lastFireTime < def.fireRate) return;
    if (w.ammo <= 0 && w.type !== 'fists') {
      WeaponActions.startReload(game, entity);
      return;
    }
    if (entity.isPlayer) entity.stats.shotsFired++;
    entity.lastFireTime = now;
    if (w.type !== 'fists') {
      w.ammo--;
      if (w.ammo === 0 && entity.isPlayer) game.sound.play('low_ammo');
    }

    for (let p = 0; p < def.pellets; p++) {
      const spread = (Math.random() - 0.5) * def.spread * 2;
      const angle = entity.angle + spread;
      if (w.type === 'fists') {
        const hx = entity.x + Math.cos(entity.angle) * 30;
        const hy = entity.y + Math.sin(entity.angle) * 30;
        CombatSystem.checkMeleeHit(game, entity, hx, hy, def.damage);
      } else {
        game.bullets.push({
          x: entity.x + Math.cos(entity.angle) * 20,
          y: entity.y + Math.sin(entity.angle) * 20,
          vx: Math.cos(angle) * def.bulletSpeed,
          vy: Math.sin(angle) * def.bulletSpeed,
          damage: def.damage,
          range: def.range,
          traveled: 0,
          owner: entity,
          color: def.color,
        });
      }
    }
    if (entity.isPlayer) game.sound.play('shoot_' + w.type);
  }

  static checkMeleeHit(game, attacker, hx, hy, damage) {
    const targets = attacker.isPlayer ? game.bots : [game.player, ...game.bots.filter(b => b !== attacker)];
    for (const t of targets) {
      if (!t.alive) continue;
      if ((t.x - hx) ** 2 + (t.y - hy) ** 2 < (t.radius + 10) ** 2) {
        CombatSystem.dealDamage(game, t, damage, attacker);
        break;
      }
    }
  }

  static dealDamage(game, target, damage, attacker) {
    let actualDmg = damage;
    if (target.armor > 0) {
      const absorb = Math.min(target.armor, damage * 0.6);
      target.armor -= absorb;
      actualDmg -= absorb;
    }
    target.hp -= actualDmg;
    target.damageFlash = 8;
    target.lastDamageTime = performance.now();
    if (target.healing) target.healing = false;

    if (target.isPlayer) {
      target.stats.damageTaken += actualDmg;
      game.sound.play('player_hit');
    }
    if (attacker && attacker.isPlayer) {
      attacker.stats.damageDealt += actualDmg;
      attacker.stats.shotsHit++;
    }

    for (let i = 0; i < 5; i++) {
      game.particles.push({
        x: target.x, y: target.y,
        vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
        life: 20, maxLife: 20, color: '#ff3333', size: 3,
      });
    }

    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      game.aliveCount--;
      game.deathOrder.push(target.name);

      // ─── LOOT EXPLOSION ──────────────────────────
      CombatSystem.explodeLoot(game, target);

      if (attacker) {
        attacker.kills++;
        if (attacker.isPlayer) attacker.stats.kills = attacker.kills;
        game.addKillFeed(attacker.name, target.name);
      } else {
        game.addKillFeed('Zone', target.name);
      }

      if (target.isPlayer) {
        game.sound.play('death');
        game.endGame(false);
      } else {
        // ─── KILL SOUND REMOVED ─────────────────────
        // game.sound.play('kill'); // <-- REMOVED

        // Drop weapons
        for (const w of target.weapons) {
          if (w.type !== 'fists') {
            game.lootItems.push({
              x: target.x + (Math.random() - 0.5) * 20,
              y: target.y + (Math.random() - 0.5) * 20,
              type: 'weapon', subtype: w.type, id: Math.random(),
              tier: CombatSystem.getWeaponTier(w.type)
            });
          }
        }
        if (target.bandages > 0) {
          game.lootItems.push({
            x: target.x, y: target.y + 15,
            type: 'heal', subtype: 'bandage', id: Math.random(),
            tier: 3
          });
        }
        if (target.medkits > 0) {
          game.lootItems.push({
            x: target.x + 10, y: target.y + 15,
            type: 'heal', subtype: 'medkit', id: Math.random(),
            tier: 1
          });
        }
      }
      if (game.aliveCount <= 1 && game.player.alive) game.endGame(true);
    }
  }

  static explodeLoot(game, entity) {
    const botColor = entity.bodyColor || '#ff4444';
    const numParticles = 25 + Math.floor(Math.random() * 15);

    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      game.particles.push({
        x: entity.x,
        y: entity.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        color: botColor,
        size: 2 + Math.random() * 5,
        type: 'explosion'
      });
    }

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = 10 + Math.random() * 30;
      game.particles.push({
        x: entity.x + Math.cos(angle) * dist,
        y: entity.y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * 60,
        vy: Math.sin(angle) * 60,
        life: 10,
        maxLife: 10,
        color: '#ffffff',
        size: 3 + Math.random() * 4,
        type: 'shockwave'
      });
    }

    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 5 + Math.random() * 20;
      game.particles.push({
        x: entity.x + Math.cos(angle) * dist,
        y: entity.y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * 20,
        vy: Math.sin(angle) * 20 - 10,
        life: 15,
        maxLife: 15,
        color: botColor,
        size: 8 + Math.random() * 8,
        type: 'glow'
      });
    }
  }

  static getWeaponTier(weaponType) {
    const tiers = {
      'sniper': 1,
      'shotgunPro': 1,
      'rifle': 2,
      'shotgun': 2,
      'pistol': 3,
      'fists': 4,
    };
    return tiers[weaponType] || 3;
  }
}