import { Entity } from './Entity.js';

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 'You', true, '#44aaff');
    this.stats = {
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      damageDealt: 0,
      damageTaken: 0,
      healsUsed: 0,
    };
    // Extended stats for match report
    this.distanceTravelled = 0;
    this.weaponKills = {};        // e.g. { pistol: 3, rifle: 1 }
    this.pingsReceived = 0;
    this.timeSpotted = 0;         // seconds within bot vision
    this.lastPosition = { x, y }; // for distance tracking
  }
}