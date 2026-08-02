export const CONFIG = {
  MAP_SIZE: 4800,
  TILE_SIZE: 64,
  PLAYER_RADIUS: 14,
  CRATE_COUNT: 60,
  BUILDING_COUNT: 20,
  TREE_COUNT: 80,
  BUSH_COUNT: 50,
  ZONE_DAMAGE_BASE: 5,
  TARGET_MODE_PROBABILITY: 0.8,
  PING_INTERVAL: 10,
  PING_HUNT_DURATION: 5,
  PING_FIRST_DELAY: 5,
  PING_PULSE_DURATION: 1.5,

  // ─── DOZX TOWN ───
  TOWN_SIZE: 900, // Updated from 700 to 900
  TOWN_LOOT_BOXES: 10,
  TOWN_POSITION: { x: 2700, y: 2700 },
  TOWN_BUILDINGS: 15,
  TOWN_NAME: 'DOZX',
};

export const ZONE_PHASES = [
  { delay: 30, shrinkTime: 30, radiusPct: 0.45 },
  { delay: 25, shrinkTime: 25, radiusPct: 0.32 },
  { delay: 20, shrinkTime: 20, radiusPct: 0.20 },
  { delay: 15, shrinkTime: 15, radiusPct: 0.10 },
  { delay: 10, shrinkTime: 10, radiusPct: 0.03 },
];