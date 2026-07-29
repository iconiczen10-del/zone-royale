import { Entity } from './Entity.js';

export class Bot extends Entity {
  constructor(x, y, name) {
    super(x, y, name, false, `hsl(${Math.random()*360}, 50%, 45%)`);
    this.ai = {
      state: 'wander',
      target: null,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      stateTimer: 0,
      shootCooldown: 0,
      visionRange: 320 + Math.random() * 120,
      accuracy: 0.5 + Math.random() * 0.4,
      aggression: 0.3 + Math.random() * 0.5,
    };
  }
}