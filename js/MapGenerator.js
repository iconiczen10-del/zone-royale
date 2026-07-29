import { CONFIG } from './config.js';

export class MapGenerator {
  static generate(game) {
    game.buildings = [];
    game.trees = [];
    game.bushes = [];
    game.crates = [];

    // Buildings
    for (let i = 0; i < CONFIG.BUILDING_COUNT; i++) {
      const w = 80 + Math.random() * 100;
      const h = 80 + Math.random() * 100;
      const x = 200 + Math.random() * (CONFIG.MAP_SIZE - 400 - w);
      const y = 200 + Math.random() * (CONFIG.MAP_SIZE - 400 - h);
      let overlap = false;
      for (const b of game.buildings) {
        if (x < b.x + b.w + 40 && x + w + 40 > b.x && y < b.y + b.h + 40 && y + h + 40 > b.y) {
          overlap = true; break;
        }
      }
      if (!overlap) {
        game.buildings.push({ x, y, w, h, color: `hsl(${30+Math.random()*20}, ${20+Math.random()*15}%, ${25+Math.random()*15}%)` });
      }
    }

    // Trees
    for (let i = 0; i < CONFIG.TREE_COUNT; i++) {
      const x = 100 + Math.random() * (CONFIG.MAP_SIZE - 200);
      const y = 100 + Math.random() * (CONFIG.MAP_SIZE - 200);
      const r = 12 + Math.random() * 10;
      let overlap = false;
      for (const b of game.buildings) {
        if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r) { overlap = true; break; }
      }
      if (!overlap) game.trees.push({ x, y, r, shade: Math.random() * 0.3 });
    }

    // Bushes
    for (let i = 0; i < CONFIG.BUSH_COUNT; i++) {
      game.bushes.push({
        x: 100 + Math.random() * (CONFIG.MAP_SIZE - 200),
        y: 100 + Math.random() * (CONFIG.MAP_SIZE - 200),
        r: 18 + Math.random() * 14
      });
    }

    // Crates
    for (let i = 0; i < CONFIG.CRATE_COUNT; i++) {
      const x = 150 + Math.random() * (CONFIG.MAP_SIZE - 300);
      const y = 150 + Math.random() * (CONFIG.MAP_SIZE - 300);
      let inBuilding = false;
      for (const b of game.buildings) {
        if (x > b.x - 10 && x < b.x + b.w + 10 && y > b.y - 10 && y < b.y + b.h + 10) { inBuilding = true; break; }
      }
      game.crates.push({ x, y, opened: false, inBuilding });
    }
  }
}