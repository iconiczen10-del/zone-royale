import { CONFIG, ZONE_PHASES } from './config.js';

export function drawWorld(game, ctx, canvas, cam) {
  drawGround(ctx, canvas, cam);
  drawMapBorder(ctx);
  drawBuildings(game, ctx, canvas, cam);
  drawBushes(game, ctx, canvas, cam);
  drawTrees(game, ctx, canvas, cam);
  drawZone(game, ctx);
  drawTownBorder(game, ctx, canvas, cam);
}

// ─── GROUND ──────────────────────────────────────────
function drawGround(ctx, canvas, cam) {
  const startTX = Math.floor(cam.x / CONFIG.TILE_SIZE);
  const startTY = Math.floor(cam.y / CONFIG.TILE_SIZE);
  const endTX = Math.ceil((cam.x + canvas.width) / CONFIG.TILE_SIZE);
  const endTY = Math.ceil((cam.y + canvas.height) / CONFIG.TILE_SIZE);

  for (let tx = startTX; tx <= endTX; tx++) {
    for (let ty = startTY; ty <= endTY; ty++) {
      if (tx < 0 || ty < 0 || tx >= CONFIG.MAP_SIZE / CONFIG.TILE_SIZE || ty >= CONFIG.MAP_SIZE / CONFIG.TILE_SIZE) continue;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#2d5a1e' : '#326321';
      ctx.fillRect(tx * CONFIG.TILE_SIZE, ty * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
    }
  }
}

// ─── MAP BORDER ──────────────────────────────────────
function drawMapBorder(ctx) {
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, CONFIG.MAP_SIZE, CONFIG.MAP_SIZE);
}

// ─── BUILDINGS ───────────────────────────────────────
function drawBuildings(game, ctx, canvas, cam) {
  for (const b of game.buildings) {
    if (b.x + b.w < cam.x - 50 || b.x > cam.x + canvas.width + 50) continue;
    if (b.y + b.h < cam.y - 50 || b.y > cam.y + canvas.height + 50) continue;

    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);

    // Roof
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(b.x + 4, b.y + 2, b.w - 8, 6);

    // Windows
    if (b.w > 50 && b.h > 50) {
      ctx.fillStyle = 'rgba(200, 200, 150, 0.3)';
      const cols = Math.floor(b.w / 25);
      const rows = Math.floor(b.h / 25);
      for (let r = 0; r < rows && r < 3; r++) {
        for (let c = 0; c < cols && c < 3; c++) {
          const wx = b.x + 8 + c * (b.w - 16) / (cols);
          const wy = b.y + 12 + r * (b.h - 20) / (rows);
          ctx.fillRect(wx, wy, 10, 12);
        }
      }
    }

    // Landmark glow
    if (b.isLandmark) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 6]);
      ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
      ctx.setLineDash([]);
    }

    // Town sign
    if (b.isSign) {
      ctx.fillStyle = '#2F4F4F';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏘️ DOZX', b.x + b.w / 2, b.y + b.h / 2);
    }

    // Building name
    if (b.name && b.isTown) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(b.name, b.x + b.w / 2, b.y - 2);
    }
  }
}

// ─── BUSHES ──────────────────────────────────────────
function drawBushes(game, ctx, canvas, cam) {
  for (const bush of game.bushes) {
    if (Math.abs(bush.x - cam.x - canvas.width / 2) > canvas.width) continue;
    ctx.fillStyle = 'rgba(34,120,34,0.6)';
    ctx.beginPath();
    ctx.arc(bush.x, bush.y, bush.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(50,150,50,0.4)';
    ctx.beginPath();
    ctx.arc(bush.x - 4, bush.y - 3, bush.r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── TREES ────────────────────────────────────────────
function drawTrees(game, ctx, canvas, cam) {
  for (const t of game.trees) {
    if (Math.abs(t.x - cam.x - canvas.width / 2) > canvas.width) continue;
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgb(${30 + t.shade * 40},${90 + t.shade * 30},${25 + t.shade * 20})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a4a0a';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ─── ZONE ─────────────────────────────────────────────
function drawZone(game, ctx) {
  const zone = game.zone;
  ctx.fillStyle = 'rgba(0,100,255,0.15)';
  ctx.beginPath();
  ctx.rect(-500, -500, CONFIG.MAP_SIZE + 1000, CONFIG.MAP_SIZE + 1000);
  ctx.arc(zone.cx, zone.cy, zone.currentRadius, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.strokeStyle = 'rgba(50,150,255,0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.arc(zone.cx, zone.cy, zone.currentRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!zone.shrinking && zone.phase < ZONE_PHASES.length) {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(zone.nextCx, zone.nextCy, zone.targetRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ─── TOWN BORDER ──────────────────────────────────────
function drawTownBorder(game, ctx, canvas, cam) {
  if (!game.towns || game.towns.length === 0) return;

  for (const town of game.towns) {
    const x = town.x - town.size / 2;
    const y = town.y - town.size / 2;
    const size = town.size;

    if (x + size < cam.x - 50 || x > cam.x + canvas.width + 50) continue;
    if (y + size < cam.y - 50 || y > cam.y + canvas.height + 50) continue;

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(x, y, size, size);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`🏘️ ${town.name}`, town.x, y - 22);
  }
}