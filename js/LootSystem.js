import { WeaponDefs } from './WeaponDefs.js';

export class LootSystem {
  static generateCrateLoot(crate) {
    const items = [];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      let type, subtype;
      if (roll < 0.10) { type = 'weapon'; subtype = 'shotgunPro'; }
      else if (roll < 0.18) { type = 'weapon'; subtype = 'shotgun'; }
      else if (roll < 0.30) { type = 'weapon'; subtype = 'rifle'; }
      else if (roll < 0.40) { type = 'weapon'; subtype = 'sniper'; }
      else if (roll < 0.52) { type = 'weapon'; subtype = 'pistol'; }
      else if (roll < 0.64) { type = 'heal'; subtype = 'bandage'; }
      else if (roll < 0.74) { type = 'heal'; subtype = 'medkit'; }
      else if (roll < 0.84) { type = 'armor'; subtype = 'vest'; }
      else { type = 'ammo'; subtype = 'ammo'; }
      items.push({
        x: crate.x + (Math.random() - 0.5) * 40,
        y: crate.y + (Math.random() - 0.5) * 40,
        type, subtype, id: Math.random()
      });
    }
    return items;
  }

  static pickupLoot(entity, game) {
    const pickupRange = 45;
    let picked = false;
    for (let i = game.lootItems.length - 1; i >= 0; i--) {
      const item = game.lootItems[i];
      const dx = entity.x - item.x, dy = entity.y - item.y;
      if (dx*dx + dy*dy < pickupRange * pickupRange) {
        if (item.type === 'weapon') {
          const existing = entity.weapons.find(w => w.type === item.subtype);
          if (existing) {
            existing.reserveAmmo += WeaponDefs[item.subtype].ammoMax;
          } else {
            entity.weapons.push({ type: item.subtype, ammo: WeaponDefs[item.subtype].ammoMax, reserveAmmo: WeaponDefs[item.subtype].ammoMax * 2 });
          }
          picked = true;
        } else if (item.type === 'heal') {
          if (item.subtype === 'bandage') entity.bandages += 2;
          else entity.medkits += 1;
          picked = true;
        } else if (item.type === 'armor') {
          entity.armor = Math.min(entity.maxArmor, entity.armor + 50);
          picked = true;
        } else if (item.type === 'ammo') {
          for (const w of entity.weapons) {
            if (w.reserveAmmo !== Infinity) w.reserveAmmo += WeaponDefs[w.type].ammoMax;
          }
          picked = true;
        }
        if (picked) {
          game.lootItems.splice(i, 1);
          if (entity.isPlayer) game.sound.play('pickup');
          break;
        }
      }
    }
    for (const crate of game.crates) {
      if (crate.opened) continue;
      const dx = entity.x - crate.x, dy = entity.y - crate.y;
      if (dx*dx + dy*dy < 50 * 50) {
        crate.opened = true;
const items = LootSystem.generateCrateLoot(crate);
game.lootItems.push(...items);
game.sound.play('crate_open', crate.x, crate.y, game.camera.x, game.camera.y);
if (entity.isPlayer) game.sound.play('pickup');
      }
    }
  }

  static dropWeapon(player, idx, game) {
    if (player.weapons[idx].type === 'fists') return;
    const w = player.weapons[idx];
    game.lootItems.push({
      x: player.x + (Math.random()-0.5)*20,
      y: player.y + (Math.random()-0.5)*20,
      type: 'weapon',
      subtype: w.type,
      id: Math.random()
    });
    player.weapons.splice(idx, 1);
    if (player.currentWeapon >= player.weapons.length) player.currentWeapon = player.weapons.length - 1;
    player.reloading = false;
    game.sound.play('drop');
  }

  static dropHeal(player, type, game) {
    if (type === 'bandages' && player.bandages > 0) {
      player.bandages--;
      game.lootItems.push({ x: player.x + (Math.random()-0.5)*20, y: player.y + (Math.random()-0.5)*20, type: 'heal', subtype: 'bandage', id: Math.random() });
      game.sound.play('drop');
    } else if (type === 'medkits' && player.medkits > 0) {
      player.medkits--;
      game.lootItems.push({ x: player.x + (Math.random()-0.5)*20, y: player.y + (Math.random()-0.5)*20, type: 'heal', subtype: 'medkit', id: Math.random() });
      game.sound.play('drop');
    }
  }

  static dropArmor(player, game) {
    if (player.armor > 0) {
      game.lootItems.push({ x: player.x + (Math.random()-0.5)*20, y: player.y + (Math.random()-0.5)*20, type: 'armor', subtype: 'vest', id: Math.random() });
      player.armor = 0;
      game.sound.play('drop');
    }
  }
}