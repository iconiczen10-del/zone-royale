import { CONFIG, ZONE_PHASES } from './config.js';
import { WeaponDefs } from './WeaponDefs.js';
import { RenderChat } from './chat/RenderChat.js';

export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  render(game) {
    const ctx = this.ctx;
    const cam = game.camera;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    this.drawGround(game, cam);
    this.drawMapBorder();
    this.drawBuildings(game, cam);
    this.drawBushes(game, cam);
    this.drawTrees(game, cam);
    this.drawCrates(game, cam);
    this.drawLoot(game, cam);
    this.drawEntities(game, cam);
    this.drawBullets(game);
    this.drawParticles(game);
    this.drawZone(game);
    RenderChat.render(game);
    ctx.restore();
    game.ui.drawHUD(game);
  }

  drawGround(game, cam) {
    const ctx = this.ctx;
    const startTX = Math.floor(cam.x / CONFIG.TILE_SIZE);
    const startTY = Math.floor(cam.y / CONFIG.TILE_SIZE);
    const endTX = Math.ceil((cam.x + this.canvas.width) / CONFIG.TILE_SIZE);
    const endTY = Math.ceil((cam.y + this.canvas.height) / CONFIG.TILE_SIZE);
    for (let tx = startTX; tx <= endTX; tx++) {
      for (let ty = startTY; ty <= endTY; ty++) {
        if (tx < 0 || ty < 0 || tx >= CONFIG.MAP_SIZE/CONFIG.TILE_SIZE || ty >= CONFIG.MAP_SIZE/CONFIG.TILE_SIZE) continue;
        ctx.fillStyle = (tx+ty)%2 === 0 ? '#2d5a1e' : '#326321';
        ctx.fillRect(tx*CONFIG.TILE_SIZE, ty*CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
      }
    }
  }

  drawMapBorder() {
    const ctx = this.ctx;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, CONFIG.MAP_SIZE, CONFIG.MAP_SIZE);
  }

  drawBuildings(game, cam) {
    const ctx = this.ctx;
    for (const b of game.buildings) {
      if (b.x+b.w < cam.x-50 || b.x > cam.x+this.canvas.width+50) continue;
      if (b.y+b.h < cam.y-50 || b.y > cam.y+this.canvas.height+50) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(b.x+b.w/2-8, b.y+b.h-4, 16, 4);
    }
  }

  drawBushes(game, cam) {
    const ctx = this.ctx;
    for (const bush of game.bushes) {
      if (Math.abs(bush.x - cam.x - this.canvas.width/2) > this.canvas.width) continue;
      ctx.fillStyle = 'rgba(34,120,34,0.6)';
      ctx.beginPath(); ctx.arc(bush.x, bush.y, bush.r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(50,150,50,0.4)';
      ctx.beginPath(); ctx.arc(bush.x-4, bush.y-3, bush.r*0.7, 0, Math.PI*2); ctx.fill();
    }
  }

  drawTrees(game, cam) {
    const ctx = this.ctx;
    for (const t of game.trees) {
      if (Math.abs(t.x - cam.x - this.canvas.width/2) > this.canvas.width) continue;
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r*0.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgb(${30+t.shade*40},${90+t.shade*30},${25+t.shade*20})`;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#1a4a0a'; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  drawCrates(game, cam) {
    const ctx = this.ctx;
    for (const crate of game.crates) {
      if (crate.opened) continue;
      if (Math.abs(crate.x - cam.x - this.canvas.width/2) > this.canvas.width) continue;
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(crate.x-12, crate.y-12, 24, 24);
      ctx.strokeStyle = '#5a4a0a'; ctx.lineWidth = 2;
      ctx.strokeRect(crate.x-12, crate.y-12, 24, 24);
      ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(crate.x-6, crate.y); ctx.lineTo(crate.x+6, crate.y);
      ctx.moveTo(crate.x, crate.y-6); ctx.lineTo(crate.x, crate.y+6); ctx.stroke();
    }
  }

  drawLoot(game, cam) {
    const ctx = this.ctx;
    for (const item of game.lootItems) {
      if (Math.abs(item.x - cam.x - this.canvas.width/2) > this.canvas.width) continue;
      let color, label;
      switch (item.type) {
        case 'weapon': color = WeaponDefs[item.subtype].color; label = item.subtype[0].toUpperCase(); break;
        case 'heal': color = item.subtype==='medkit'?'#ff4488':'#44ff88'; label = item.subtype==='medkit'?'+':'b'; break;
        case 'armor': color = '#4488ff'; label = 'A'; break;
        case 'ammo': color = '#ffaa00'; label = '•'; break;
      }
      ctx.fillStyle = color+'44'; ctx.beginPath(); ctx.arc(item.x, item.y, 14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(item.x, item.y, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, item.x, item.y);
    }
  }

  drawEntities(game, cam) {
    for (const bot of game.bots) if (bot.alive) this.drawEntity(bot, bot === game.currentLeader);
    if (game.player.alive) this.drawEntity(game.player, game.player === game.currentLeader);
  }

  drawEntity(entity, isLeader = false) {
    const ctx = this.ctx;

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

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(entity.x + 2, entity.y + 4, entity.radius, entity.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    const flashColor = entity.damageFlash > 0 ? '#ff4444' : entity.bodyColor;
    ctx.fillStyle = flashColor;
    ctx.beginPath(); ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();

    const wDef = entity.currentWeaponDef;
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(entity.x, entity.y);
    ctx.lineTo(entity.x + Math.cos(entity.angle) * 22, entity.y + Math.sin(entity.angle) * 22);
    ctx.stroke();
    ctx.strokeStyle = wDef.color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(entity.x, entity.y);
    ctx.lineTo(entity.x + Math.cos(entity.angle) * 22, entity.y + Math.sin(entity.angle) * 22);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#fff';
    const eyeOffX = Math.cos(entity.angle) * 5, eyeOffY = Math.sin(entity.angle) * 5;
    ctx.beginPath();
    ctx.arc(entity.x + eyeOffX - Math.sin(entity.angle) * 3, entity.y + eyeOffY + Math.cos(entity.angle) * 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(entity.x + eyeOffX + Math.sin(entity.angle) * 3, entity.y + eyeOffY - Math.cos(entity.angle) * 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (!entity.isPlayer) {
      const barW = 30, barH = 4, hpPct = entity.hp / entity.maxHp;
      ctx.fillStyle = '#333'; ctx.fillRect(entity.x - barW / 2, entity.y - entity.radius - 10, barW, barH);
      ctx.fillStyle = hpPct > 0.5 ? '#44ff44' : hpPct > 0.25 ? '#ffaa00' : '#ff3333';
      ctx.fillRect(entity.x - barW / 2, entity.y - entity.radius - 10, barW * hpPct, barH);
    }

    ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
    ctx.fillText(entity.name, entity.x, entity.y - entity.radius - 14);

    if (entity.healing) {
      const progress = (performance.now() - entity.healStart) / entity.healDuration;
      ctx.strokeStyle = '#44ff88'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, entity.radius + 5, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
    }
    if (entity.reloading) {
      const wDef2 = WeaponDefs[entity.weapons[entity.currentWeapon]?.type || 'fists'];
      const progress = (performance.now() - entity.reloadStart) / wDef2.reloadTime;
      ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, entity.radius + 5, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
    }
  }

  drawBullets(game) {
    const ctx = this.ctx;
    for (const b of game.bullets) {
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = b.color+'88'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x-b.vx*2, b.y-b.vy*2); ctx.stroke();
    }
  }

  drawParticles(game) {
    const ctx = this.ctx;
    for (const pt of game.particles) {
      const alpha = pt.life/pt.maxLife;
      ctx.fillStyle = pt.color + Math.floor(alpha*255).toString(16).padStart(2,'0');
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size*alpha, 0, Math.PI*2); ctx.fill();
    }
  }

  drawZone(game) {
    const ctx = this.ctx;
    const zone = game.zone;
    ctx.fillStyle = 'rgba(0,100,255,0.15)';
    ctx.beginPath(); ctx.rect(-500, -500, CONFIG.MAP_SIZE+1000, CONFIG.MAP_SIZE+1000);
    ctx.arc(zone.cx, zone.cy, zone.currentRadius, 0, Math.PI*2, true); ctx.fill();
    ctx.strokeStyle = 'rgba(50,150,255,0.8)'; ctx.lineWidth = 3; ctx.setLineDash([10,5]);
    ctx.beginPath(); ctx.arc(zone.cx, zone.cy, zone.currentRadius, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    if (!zone.shrinking && zone.phase < ZONE_PHASES.length) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([8,8]);
      ctx.beginPath(); ctx.arc(zone.nextCx, zone.nextCy, zone.targetRadius, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    }
  }
}