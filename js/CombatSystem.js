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
      WeaponActions.startReload(game, entity);   // cyclic? we'll import inside or move to Game
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
        game.sound.play('kill');
        for (const w of target.weapons) {
          if (w.type !== 'fists') {
            game.lootItems.push({
              x: target.x + (Math.random() - 0.5) * 20,
              y: target.y + (Math.random() - 0.5) * 20,
              type: 'weapon', subtype: w.type, id: Math.random()
            });
          }
        }
        if (target.bandages > 0) game.lootItems.push({ x: target.x, y: target.y + 15, type: 'heal', subtype: 'bandage', id: Math.random() });
        if (target.medkits > 0) game.lootItems.push({ x: target.x + 10, y: target.y + 15, type: 'heal', subtype: 'medkit', id: Math.random() });
      }
      if (game.aliveCount <= 1 && game.player.alive) game.endGame(true);
    }
  }
}