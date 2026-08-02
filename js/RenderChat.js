export class RenderChat {
  /**
   * Draws a single speech bubble above an entity.
   */
  static drawBubble(ctx, entity, text, alpha) {
    if (alpha <= 0) return;

    const bubbleY = entity.y - entity.radius - 22;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Measure text
    ctx.font = 'bold 10px Arial';
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const bubbleWidth = textWidth + 16;
    const bubbleHeight = 22;
    const bubbleX = entity.x - bubbleWidth / 2;

    // Bubble background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 6);
    ctx.fill();

    // Bubble border (entity colour)
    ctx.strokeStyle = entity.bodyColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pointer (small triangle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(entity.x - 5, bubbleY + bubbleHeight);
    ctx.lineTo(entity.x, bubbleY + bubbleHeight + 6);
    ctx.lineTo(entity.x + 5, bubbleY + bubbleHeight);
    ctx.fill();

    ctx.strokeStyle = entity.bodyColor;
    ctx.beginPath();
    ctx.moveTo(entity.x - 5, bubbleY + bubbleHeight);
    ctx.lineTo(entity.x, bubbleY + bubbleHeight + 6);
    ctx.lineTo(entity.x + 5, bubbleY + bubbleHeight);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, entity.x, bubbleY + bubbleHeight / 2);

    ctx.restore();
  }

  /**
   * Renders all active chat messages.
   */
  static render(game) {
    const ctx = game.renderer.ctx;
    const cam = game.camera;
    const now = performance.now();

    for (let i = game.chatManager.messages.length - 1; i >= 0; i--) {
      const msg = game.chatManager.messages[i];
      const elapsed = (now - msg.time) / 1000;
      const life = game.chatManager.messageLife;

      if (elapsed >= life) {
        game.chatManager.messages.splice(i, 1);
        continue;
      }

      // Fade out in last 0.5 seconds
      const alpha = elapsed > life - 0.5 ? (life - elapsed) / 0.5 : 1;

      // Only draw if entity is alive and on screen
      if (msg.entity && msg.entity.alive) {
        const screenX = msg.entity.x - cam.x;
        const screenY = msg.entity.y - cam.y;
        if (screenX > -100 && screenX < game.canvas.width + 100 &&
            screenY > -100 && screenY < game.canvas.height + 100) {
          RenderChat.drawBubble(ctx, msg.entity, msg.text, alpha);
        }
      }
    }
  }
}