import { WeaponDefs } from './WeaponDefs.js';
import { CONFIG } from './config.js';

export class Entity {
  constructor(x, y, name, isPlayer, bodyColor) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.isPlayer = isPlayer;
    this.alive = true;
    this.hp = 100;
    this.maxHp = 100;
    this.armor = 0;
    this.maxArmor = 100;
    this.speed = isPlayer ? 180 : 140 + Math.random() * 40;
    this.angle = 0;
    this.radius = CONFIG.PLAYER_RADIUS;
    this.weapons = [{ type: 'fists', ammo: Infinity, reserveAmmo: Infinity }];
    this.currentWeapon = 0;
    this.lastFireTime = 0;
    this.reloading = false;
    this.reloadStart = 0;
    this.healing = false;
    this.healStart = 0;
    this.healDuration = 0;
    this.healAmount = 0;
    this.lastDamageTime = 0;
    this.bandages = 0;
    this.medkits = 0;
    this.bodyColor = bodyColor;
    this.damageFlash = 0;
    this.kills = 0;   // kill counter for leader glow
  }

  get currentWeaponDef() {
    return WeaponDefs[this.weapons[this.currentWeapon]?.type || 'fists'];
  }

  get currentWeaponData() {
    return this.weapons[this.currentWeapon];
  }
}