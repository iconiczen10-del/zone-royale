import { ZONE_PHASES, CONFIG } from './config.js';

export class ZoneManager {
  constructor(mapSize) {
    this.cx = mapSize / 2;
    this.cy = mapSize / 2;
    this.currentRadius = mapSize * 0.7;
    this.targetRadius = mapSize * 0.7;
    this.startRadius = mapSize * 0.7;
    this.nextCx = mapSize / 2;
    this.nextCy = mapSize / 2;
    this.startCx = mapSize / 2;
    this.startCy = mapSize / 2;
    this.phase = 0;
    this.phaseTimer = 0;
    this.shrinking = false;
    this.shrinkTimer = 0;
    this.damageTimer = 0;
    this.mapSize = mapSize;
  }

  update(dt) {
    if (this.phase >= ZONE_PHASES.length) {
      this.damageTimer += dt;
      return;
    }

    const phase = ZONE_PHASES[this.phase];

    if (!this.shrinking) {
      this.phaseTimer += dt;
      if (this.phaseTimer >= phase.delay) {
        this.shrinking = true;
        this.shrinkTimer = 0;
        this.startRadius = this.currentRadius;
        this.startCx = this.cx;
        this.startCy = this.cy;
        const maxOffset = this.currentRadius * 0.2;
        this.nextCx = this.mapSize/2 + (Math.random()-0.5) * maxOffset * 2;
        this.nextCy = this.mapSize/2 + (Math.random()-0.5) * maxOffset * 2;
        this.nextCx = Math.max(phase.radiusPct * this.mapSize, Math.min(this.mapSize - phase.radiusPct * this.mapSize, this.nextCx));
        this.nextCy = Math.max(phase.radiusPct * this.mapSize, Math.min(this.mapSize - phase.radiusPct * this.mapSize, this.nextCy));
        this.targetRadius = phase.radiusPct * this.mapSize * 0.707;
      }
    } else {
      this.shrinkTimer += dt;
      const progress = Math.min(1, this.shrinkTimer / phase.shrinkTime);
      const ease = progress < 0.5 ? 2*progress*progress : 1-Math.pow(-2*progress+2,2)/2;
      this.currentRadius = this.startRadius + (this.targetRadius - this.startRadius) * ease;
      this.cx = this.startCx + (this.nextCx - this.startCx) * ease;
      this.cy = this.startCy + (this.nextCy - this.startCy) * ease;
      if (progress >= 1) {
        this.shrinking = false;
        this.phaseTimer = 0;
        this.phase++;
        this.currentRadius = this.targetRadius;
        this.cx = this.nextCx;
        this.cy = this.nextCy;
      }
    }
  }

  applyDamage(entities, game) {
    this.damageTimer += 0; // will be called externally
    // The damage logic is now in Game.update() to keep zone and game logic separate.
    // This method can be used to check if an entity is outside.
  }

  isOutside(entity) {
    const d = Math.sqrt((entity.x - this.cx)**2 + (entity.y - this.cy)**2);
    return d > this.currentRadius;
  }
}