import { WeaponDefs } from './WeaponDefs.js';

export function drawEntities(game, ctx, canvas, cam) {
  // Draw bots
  for (const bot of game.bots) {
    if (bot.alive) drawEntity(bot, bot === game.currentLeader, ctx);
  }

  // Draw player
  if (game.player.alive) {
    drawEntity(game.player, game.player === game.currentLeader, ctx);
  }

  // Draw bullets
  drawBullets(game, ctx);

  // Draw particles
  drawParticles(game, ctx);
}

// ─── ENTITY ────────────────────────────────────────────
function drawEntity(entity, isLeader, ctx) {
  // Leader glow
  if (isLeader) {
    const pulse = 0.6 + Math.sin(performance.now() / 300) * 0.2;
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 18 + Math.sin(performance.now() / 300) * 4;
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
    ctx.fill();
    ctx.restore();
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(entity.x + 2, entity.y + 4, entity.radius, entity.radius * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const flashColor = entity.damageFlash > 0 ? '#ff4444' : entity.bodyColor;
  ctx.fillStyle = flashColor;
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Weapon
  const wDef = entity.currentWeaponDef;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(entity.x, entity.y);
  ctx.lineTo(entity.x + Math.cos(entity.angle) * 22, entity.y + Math.sin(entity.angle) * 22);
  ctx.stroke();
  ctx.strokeStyle = wDef.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(entity.x, entity.y);
  ctx.lineTo(entity.x + Math.cos(entity.angle) * 22, entity.y + Math.sin(entity.angle) * 22);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#fff';
  const eyeOffX = Math.cos(entity.angle) * 5;
  const eyeOffY = Math.sin(entity.angle) * 5;
  ctx.beginPath();
  ctx.arc(entity.x + eyeOffX - Math.sin(entity.angle) * 3, entity.y + eyeOffY + Math.cos(entity.angle) * 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(entity.x + eyeOffX + Math.sin(entity.angle) * 3, entity.y + eyeOffY - Math.cos(entity.angle) * 3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Health bar (bots only)
  if (!entity.isPlayer) {
    const barW = 30, barH = 4, hpPct = entity.hp / entity.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(entity.x - barW / 2, entity.y - entity.radius - 10, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#44ff44' : hpPct > 0.25 ? '#ffaa00' : '#ff3333';
    ctx.fillRect(entity.x - barW / 2, entity.y - entity.radius - 10, barW * hpPct, barH);
  }

  // Name
  ctx.fillStyle = '#fff';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(entity.name, entity.x, entity.y - entity.radius - 14);

  // Healing ring
  if (entity.healing) {
    const progress = (performance.now() - entity.healStart) / entity.healDuration;
    ctx.strokeStyle = '#44ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius + 5, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();
  }

  // Reloading ring
  if (entity.reloading) {
    const wDef2 = WeaponDefs[entity.weapons[entity.currentWeapon]?.type || 'fists'];
    const progress = (performance.now() - entity.reloadStart) / wDef2.reloadTime;
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius + 5, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();
  }
}

// ─── BULLETS ──────────────────────────────────────────
function drawBullets(game, ctx) {
  for (const b of game.bullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = b.color + '88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2);
    ctx.stroke();
  }
}

// ─── PARTICLES ────────────────────────────────────────
function drawParticles(game, ctx) {
  for (const pt of game.particles) {
    const alpha = pt.life / pt.maxLife;
    ctx.fillStyle = pt.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
}