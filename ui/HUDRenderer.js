import { CONFIG, ZONE_PHASES } from '../js/config.js';
import { WeaponDefs } from '../js/WeaponDefs.js';

export function drawHUD(game, ctx) {
  const p = game.player;
  const canvas = game.canvas;

  // FPS is handled by UIManager.updateFPSDisplay()

  const hudX = 20, hudY = canvas.height - 130;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(hudX - 5, hudY - 5, 260, 125);
  ctx.strokeStyle = '#333';
  ctx.strokeRect(hudX - 5, hudY - 5, 260, 125);

  // Health bar
  ctx.fillStyle = '#333';
  ctx.fillRect(hudX, hudY, 200, 18);
  const hpPct = p.hp / p.maxHp;
  ctx.fillStyle = hpPct > 0.5 ? '#44cc44' : hpPct > 0.25 ? '#ccaa00' : '#cc3333';
  ctx.fillRect(hudX, hudY, 200 * hpPct, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`HP: ${Math.ceil(p.hp)}/${p.maxHp}`, hudX + 5, hudY + 13);

  // Armor bar
  ctx.fillStyle = '#333';
  ctx.fillRect(hudX, hudY + 24, 200, 14);
  const arPct = p.armor / p.maxArmor;
  ctx.fillStyle = '#4488ff';
  ctx.fillRect(hudX, hudY + 24, 200 * arPct, 14);
  ctx.fillStyle = '#fff';
  ctx.font = '11px Arial';
  ctx.fillText(`Armor: ${Math.ceil(p.armor)}`, hudX + 5, hudY + 35);

  // Weapon
  const w = p.currentWeaponData;
  const wDef = p.currentWeaponDef;
  ctx.fillStyle = wDef.color;
  ctx.font = 'bold 14px Arial';
  ctx.fillText(wDef.name, hudX, hudY + 58);
  ctx.fillStyle = '#ccc';
  ctx.font = '12px Arial';
  if (w.type !== 'fists') {
    ctx.fillText(`Ammo: ${w.ammo}/${w.reserveAmmo}`, hudX, hudY + 74);
  } else {
    ctx.fillText('Melee', hudX, hudY + 74);
  }
  if (p.reloading) {
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('RELOADING...', hudX + 100, hudY + 58);
  }

  // Items
  ctx.fillStyle = '#aaa';
  ctx.font = '11px Arial';
  ctx.fillText(`🩹:${p.bandages} 💊:${p.medkits}`, hudX, hudY + 92);
  ctx.fillText(`Weapons: ${p.weapons.map(w2 => WeaponDefs[w2.type].name).join(', ')}`, hudX, hudY + 106);

  // Stats (top right)
  const stats = p.stats;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(canvas.width - 180, 10, 170, 60);
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`Kills: ${stats.kills}   DMG: ${stats.damageDealt}`, canvas.width - 15, 30);
  const accuracy = stats.shotsFired ? ((stats.shotsHit / stats.shotsFired) * 100).toFixed(1) : '0.0';
  ctx.fillText(`Accuracy: ${accuracy}%`, canvas.width - 15, 48);

  // Alive count + Zone timer
  const zone = game.zone;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(canvas.width / 2 - 140, 8, 280, 50);
  ctx.strokeStyle = '#333';
  ctx.strokeRect(canvas.width / 2 - 140, 8, 280, 50);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Alive: ${game.aliveCount}/${game.botCount + 1}`, canvas.width / 2, 26);
  if (zone.phase < ZONE_PHASES.length) {
    const phase = ZONE_PHASES[zone.phase];
    if (!zone.shrinking) {
      ctx.fillText(`Zone shrinks in: ${Math.ceil(phase.delay - zone.phaseTimer)}s (Phase ${zone.phase + 1}/${ZONE_PHASES.length})`, canvas.width / 2, 46);
    } else {
      ctx.fillText(`⚠️ SHRINKING! ${Math.ceil(phase.shrinkTime - zone.shrinkTimer)}s left`, canvas.width / 2, 46);
    }
  } else {
    ctx.fillText('FINAL ZONE - GET TO CENTER!', canvas.width / 2, 46);
  }

  // Kill feed
  drawKillFeed(game, ctx);

  // Minimap
  drawMinimap(game, ctx);

  // Loot pickup hint
  if (p.alive) {
    let nearby = false;
    for (const item of game.lootItems) {
      if ((p.x - item.x) ** 2 + (p.y - item.y) ** 2 < 45 ** 2) { nearby = true; break; }
    }
    if (!nearby) {
      for (const crate of game.crates) {
        if (!crate.opened && (p.x - crate.x) ** 2 + (p.y - crate.y) ** 2 < 50 ** 2) {
          nearby = true;
          break;
        }
      }
    }
    if (nearby) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(canvas.width / 2 - 60, canvas.height - 160, 120, 25);
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('[E] Pick up loot', canvas.width / 2, canvas.height - 143);
    }
  }

  // Damage flash
  if (p.damageFlash > 0) {
    ctx.fillStyle = `rgba(255,0,0,${p.damageFlash * 0.03})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Zone warning
  if (p.alive && game.zone.isOutside(p)) {
    ctx.fillStyle = `rgba(0,100,255,${0.1 + Math.sin(performance.now() / 200) * 0.05})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('⚠️ OUTSIDE SAFE ZONE - TAKING DAMAGE ⚠️', canvas.width / 2, 85);
  }
}

export function drawMinimap(game, ctx) {
  const mmSize = 150, mmX = 12, mmY = 12, scale = mmSize / CONFIG.MAP_SIZE;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(mmX, mmY, mmSize, mmSize);
  ctx.strokeStyle = '#555';
  ctx.strokeRect(mmX, mmY, mmSize, mmSize);

  // Buildings
  ctx.fillStyle = '#4a4a3a';
  for (const b of game.buildings) {
    ctx.fillRect(mmX + b.x * scale, mmY + b.y * scale, Math.max(2, b.w * scale), Math.max(2, b.h * scale));
  }

  // Zone
  const zone = game.zone;
  ctx.strokeStyle = 'rgba(50,150,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(mmX + zone.cx * scale, mmY + zone.cy * scale, zone.currentRadius * scale, 0, Math.PI * 2);
  ctx.stroke();
  if (!zone.shrinking && zone.phase < ZONE_PHASES.length) {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mmX + zone.nextCx * scale, mmY + zone.nextCy * scale, zone.targetRadius * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Bots
  for (const bot of game.bots) {
    if (bot.alive) {
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(mmX + bot.x * scale - 1, mmY + bot.y * scale - 1, 3, 3);
    }
  }

  // Player
  if (game.player.alive) {
    ctx.fillStyle = '#44aaff';
    ctx.beginPath();
    ctx.arc(mmX + game.player.x * scale, mmY + game.player.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#88ccff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mmX + game.player.x * scale, mmY + game.player.y * scale);
    ctx.lineTo(mmX + (game.player.x + Math.cos(game.player.angle) * 100) * scale, mmY + (game.player.y + Math.sin(game.player.angle) * 100) * scale);
    ctx.stroke();
  }

  // Ping pulse
  const now = performance.now();
  if (game.pingPulseStart && now - game.pingPulseStart < CONFIG.PING_PULSE_DURATION * 1000) {
    const elapsed = (now - game.pingPulseStart) / 1000;
    const maxRadius = mmSize * 0.2;
    const radius = (elapsed / CONFIG.PING_PULSE_DURATION) * maxRadius;
    const alpha = 1 - (elapsed / CONFIG.PING_PULSE_DURATION);
    ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mmX + game.pingPulsePos.x * scale, mmY + game.pingPulsePos.y * scale, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawKillFeed(game, ctx) {
  const canvas = game.canvas;
  ctx.textAlign = 'right';
  for (let i = 0; i < game.killFeed.length; i++) {
    const kf = game.killFeed[i];
    const age = (performance.now() - kf.time) / 1000;
    const alpha = age > 4 ? 1 - (age - 4) / 2 : 1;
    if (alpha <= 0) continue;
    const yy = 70 + i * 22;
    ctx.fillStyle = `rgba(0,0,0,${0.6 * alpha})`;
    ctx.fillRect(canvas.width - 270, yy - 12, 260, 20);
    ctx.font = '11px Arial';
    ctx.fillStyle = kf.killer === 'You' ? '#44aaff' : kf.killer === 'Zone' ? '#4488ff' : '#ffaa44';
    ctx.globalAlpha = alpha;
    ctx.fillText(`${kf.killer} ⟶ ${kf.victim}`, canvas.width - 18, yy + 2);
    ctx.globalAlpha = 1;
  }
}