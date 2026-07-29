import { CONFIG } from './config.js';

export class CollisionSystem {
  static circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX, dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
  }

  static isBlocked(game, x, y, r) {
    for (const b of game.buildings) {
      if (CollisionSystem.circleRectCollision(x, y, r, b.x, b.y, b.w, b.h)) return true;
    }
    for (const t of game.trees) {
      if ((x - t.x) ** 2 + (y - t.y) ** 2 < (r + t.r) ** 2) return true;
    }
    if (x - r < 0 || x + r > CONFIG.MAP_SIZE || y - r < 0 || y + r > CONFIG.MAP_SIZE) return true;
    return false;
  }

  static lineHitsBuilding(game, x1, y1, x2, y2) {
    for (const b of game.buildings) {
      if (CollisionSystem.lineIntersectsRect(x1, y1, x2, y2, b.x, b.y, b.w, b.h)) return true;
    }
    return false;
  }

  static lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    return (
      CollisionSystem.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
      CollisionSystem.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
      CollisionSystem.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh) ||
      CollisionSystem.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh)
    );
  }

  static lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (d === 0) return false;
    const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
    const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  static dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}