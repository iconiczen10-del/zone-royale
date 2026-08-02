import { WeaponDefs } from './WeaponDefs.js';

export function drawLoot(game, ctx, canvas, cam) {
  drawCrates(game, ctx, canvas, cam);
  drawLootItems(game, ctx, canvas, cam);
}

// ─── CRATES ───────────────────────────────────────────
function drawCrates(game, ctx, canvas, cam) {
  for (const crate of game.crates) {
    if (crate.opened) continue;
    if (Math.abs(crate.x - cam.x - canvas.width / 2) > canvas.width) continue;

    ctx.fillStyle = '#8B6914';
    ctx.fillRect(crate.x - 12, crate.y - 12, 24, 24);
    ctx.strokeStyle = '#5a4a0a';
    ctx.lineWidth = 2;
    ctx.strokeRect(crate.x - 12, crate.y - 12, 24, 24);

    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(crate.x - 6, crate.y);
    ctx.lineTo(crate.x + 6, crate.y);
    ctx.moveTo(crate.x, crate.y - 6);
    ctx.lineTo(crate.x, crate.y + 6);
    ctx.stroke();
  }
}

// ─── LOOT ITEMS ───────────────────────────────────────
function drawLootItems(game, ctx, canvas, cam) {
  const tierColors = {
    1: '#b44dff', // God Tier (Purple)
    2: '#4488ff', // Rare (Blue)
    3: '#44cc44', // Uncommon (Green)
    4: '#aaaaaa', // Common (White)
  };

  for (const item of game.lootItems) {
    if (Math.abs(item.x - cam.x - canvas.width / 2) > canvas.width) continue;

    const tier = item.tier || 3;
    const tierColor = tierColors[tier] || '#aaaaaa';

    let color, label;
    switch (item.type) {
      case 'weapon':
        color = WeaponDefs[item.subtype]?.color || '#ffaa00';
        label = item.subtype?.[0]?.toUpperCase() || 'W';
        break;
      case 'heal':
        color = item.subtype === 'medkit' ? '#ff4488' : '#44ff88';
        label = item.subtype === 'medkit' ? '+' : 'b';
        break;
      case 'armor':
        color = '#4488ff';
        label = 'A';
        break;
      case 'ammo':
        color = '#ffaa00';
        label = '•';
        break;
      default:
        color = '#888';
        label = '?';
    }

    // Glow/aura
    ctx.shadowColor = tierColor;
    ctx.shadowBlur = 12;

    // Background circle (tier colored)
    ctx.fillStyle = tierColor + '44';
    ctx.beginPath();
    ctx.arc(item.x, item.y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Main icon
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, item.x, item.y);

    // Tier indicator dot
    ctx.fillStyle = tierColor;
    ctx.beginPath();
    ctx.arc(item.x + 12, item.y - 12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }
}