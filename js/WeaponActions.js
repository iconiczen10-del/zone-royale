import { WeaponDefs } from './WeaponDefs.js';

export class WeaponActions {
  static switchWeapon(entity, idx) {
    if (idx < entity.weapons.length) {
      entity.currentWeapon = idx;
      entity.reloading = false;
      entity.healing = false;
    }
  }

  static startReload(game, entity) {
    const w = entity.currentWeaponData;
    const def = entity.currentWeaponDef;
    if (!w || w.type === 'fists') return;
    if (w.ammo >= def.ammoMax) return;
    if (w.reserveAmmo <= 0) return;
    if (entity.reloading) return;
    entity.reloading = true;
    entity.reloadStart = performance.now();
    entity.healing = false;
    if (entity.isPlayer) game.sound.play('reload');
  }

  static finishReload(game, entity) {
    const w = entity.currentWeaponData;
    const def = entity.currentWeaponDef;
    const needed = def.ammoMax - w.ammo;
    const give = Math.min(needed, w.reserveAmmo);
    w.ammo += give;
    if (w.reserveAmmo !== Infinity) w.reserveAmmo -= give;
    entity.reloading = false;
  }

  static startHeal(game, entity) {
    if (entity.healing) return;
    const now = performance.now();
    if (now - entity.lastDamageTime < 2000) return;
    if (entity.hp >= entity.maxHp) return;
    if (entity.medkits > 0) {
      entity.healing = true;
      entity.healStart = now;
      entity.healDuration = 4000;
      entity.healAmount = 75;
      entity.medkits--;
      if (entity.isPlayer) {
        entity.stats.healsUsed++;
        game.sound.play('heal');
      }
    } else if (entity.bandages > 0) {
      entity.healing = true;
      entity.healStart = now;
      entity.healDuration = 3000;
      entity.healAmount = 30;
      entity.bandages--;
      if (entity.isPlayer) {
        entity.stats.healsUsed++;
        game.sound.play('heal');
      }
    }
  }
}