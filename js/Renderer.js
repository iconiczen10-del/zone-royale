import { CONFIG } from './config.js';
import { RenderChat } from './RenderChat.js';
import { drawWorld } from './WorldRenderer.js';
import { drawEntities } from './EntityRenderer.js';
import { drawLoot } from './LootRenderer.js';
import { drawHUD } from './HUDRenderer.js';

export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  render(game) {
    const ctx = this.ctx;
    const cam = game.camera;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // ─── WORLD ──────────────────────────────────────
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // Draw world elements (ground, buildings, trees, zone, town border)
    drawWorld(game, ctx, this.canvas, cam);

    // Draw loot (crates + loot items)
    drawLoot(game, ctx, this.canvas, cam);

    // Draw entities (player, bots, bullets, particles)
    drawEntities(game, ctx, this.canvas, cam);

    // Draw chat bubbles
    RenderChat.render(game);

    ctx.restore();

    // ─── UI ──────────────────────────────────────────
    // FPS counter (DOM)
    game.ui.updateFPSDisplay(game);

    // HUD (canvas-based)
    drawHUD(game, ctx);
  }
}