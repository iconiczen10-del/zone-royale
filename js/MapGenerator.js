import { CONFIG } from './config.js';

export class MapGenerator {
  static generate(game) {
    game.buildings = [];
    game.trees = [];
    game.bushes = [];
    game.crates = [];
    game.towns = [];

    // Generate normal buildings
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

    // Generate DOZX Town
    MapGenerator.generateDOZXTown(game);

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

  static generateDOZXTown(game) {
    const townX = CONFIG.TOWN_POSITION.x;
    const townY = CONFIG.TOWN_POSITION.y;
    const size = CONFIG.TOWN_SIZE; // Now 900
    const buildings = [];
    const colors = MapGenerator.getTownColors();

    // ─── BUILDING TYPES ──────────────────────────
    const buildingTypes = [
      // Small houses (4)
      { w: 60, h: 60, name: 'Cottage' },
      { w: 80, h: 60, name: 'Bungalow' },
      { w: 50, h: 70, name: 'Cabin' },
      { w: 50, h: 50, name: 'Hut' },
      // Medium buildings (6)
      { w: 90, h: 70, name: 'Shop' },
      { w: 80, h: 80, name: 'Cafe' },
      { w: 100, h: 60, name: 'Garage' },
      { w: 70, h: 90, name: 'Workshop' },
      { w: 80, h: 100, name: 'Townhouse' },
      { w: 90, h: 90, name: 'Studio' },
      // Large buildings (3)
      { w: 120, h: 80, name: 'Warehouse' },
      { w: 100, h: 100, name: 'Market' },
      { w: 80, h: 120, name: 'Church' },
      // Unique buildings (2)
      { w: 60, h: 60, name: 'Windmill' },
      { w: 50, h: 50, name: 'Tower' },
    ];

    // ─── PLACE BUILDINGS (Natural Layout, more spread) ──
    for (let i = 0; i < CONFIG.TOWN_BUILDINGS && i < buildingTypes.length; i++) {
      const type = buildingTypes[i];
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        // Organic clustering with more spread for 900x900
        const angle = Math.random() * Math.PI * 2;
        const radius = 100 + Math.random() * 300; // Increased spread
        const cx = townX + Math.cos(angle) * radius;
        const cy = townY + Math.sin(angle) * radius;
        const ox = (Math.random() - 0.5) * 80;
        const oy = (Math.random() - 0.5) * 80;
        const x = cx + ox;
        const y = cy + oy;

        // Check bounds (larger town = more room)
        if (x < townX - size/2 + 10 || x + type.w > townX + size/2 - 10 ||
            y < townY - size/2 + 10 || y + type.h > townY + size/2 - 10) {
          attempts++;
          continue;
        }

        // Check overlap with existing buildings
        let overlap = false;
        for (const b of buildings) {
          if (x < b.x + b.w + 20 && x + type.w + 20 > b.x &&
              y < b.y + b.h + 20 && y + type.h + 20 > b.y) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          const colorIdx = i % colors.length;
          buildings.push({
            x, y,
            w: type.w + (Math.random() - 0.5) * 10,
            h: type.h + (Math.random() - 0.5) * 10,
            color: colors[colorIdx],
            name: type.name,
            isLandmark: type.name === 'Church' || type.name === 'Market' || type.name === 'Tower'
          });
          placed = true;
        }
        attempts++;
      }
    }

    // ─── ADD TO GAME ──────────────────────────────
    for (const b of buildings) {
      game.buildings.push({
        x: b.x, y: b.y,
        w: b.w, h: b.h,
        color: b.color,
        isTown: true,
        name: b.name,
        isLandmark: b.isLandmark || false
      });
    }

    // ─── LANDMARKS ─────────────────────────────────
    // Town Hall (center)
    game.buildings.push({
      x: townX - 40, y: townY - 40,
      w: 80, h: 80,
      color: '#8B4513',
      isTown: true,
      name: 'Town Hall',
      isLandmark: true
    });

    // Town Sign (entrance)
    game.buildings.push({
      x: townX - 100, y: townY + size/2 - 30,
      w: 200, h: 25,
      color: '#2F4F4F',
      isTown: true,
      name: 'DOZX Sign',
      isLandmark: true,
      isSign: true
    });

    // ─── TOWN DATA ─────────────────────────────────
    const town = {
      x: townX,
      y: townY,
      size: size,
      name: CONFIG.TOWN_NAME,
      buildings: buildings,
      lootBoxes: []
    };

    // ─── LOOT BOXES (10 top-tier) ─────────────────
    const lootTypes = [
      { type: 'weapon', subtype: 'shotgunPro' },
      { type: 'weapon', subtype: 'sniper' },
      { type: 'weapon', subtype: 'rifle' },
      { type: 'weapon', subtype: 'shotgun' },
      { type: 'weapon', subtype: 'pistol' },
      { type: 'heal', subtype: 'medkit' },
      { type: 'heal', subtype: 'medkit' },
      { type: 'armor', subtype: 'vest' },
      { type: 'armor', subtype: 'vest' },
      { type: 'weapon', subtype: 'shotgunPro' },
    ];

    for (let i = 0; i < CONFIG.TOWN_LOOT_BOXES && i < lootTypes.length; i++) {
      let placed = false;
      let attempts = 0;
      let lx, ly;

      while (!placed && attempts < 50) {
        lx = townX + (Math.random() - 0.5) * size * 0.7;
        ly = townY + (Math.random() - 0.5) * size * 0.7;
        let overlap = false;
        for (const b of game.buildings) {
          if (lx > b.x - 15 && lx < b.x + b.w + 15 &&
              ly > b.y - 15 && ly < b.y + b.h + 15) {
            overlap = true;
            break;
          }
        }
        if (!overlap) {
          placed = true;
          const lootItem = {
            x: lx, y: ly,
            type: lootTypes[i].type,
            subtype: lootTypes[i].subtype,
            id: Math.random(),
            isTownLoot: true,
            tier: i < 5 ? 1 : 2
          };
          game.lootItems.push(lootItem);
          town.lootBoxes.push(lootItem);
        }
        attempts++;
      }
    }

    game.towns.push(town);
  }

  static getTownColors() {
    return [
      '#8B7355', '#A0522D', '#CD853F', '#D2B48C', '#F5DEB3',
      '#DEB887', '#D2691E', '#C4A882', '#B8860B', '#8B4513',
      '#CD5C5C', '#8B0000', '#556B2F', '#6B8E23', '#2F4F4F',
      '#4682B4', '#5F9EA0', '#8FBC8F', '#BC8F8F', '#4A2A1A'
    ];
  }
}