import { Footprint, Vec2 } from './movement';

/** Room dimensions in metres; the origin is the floor centre. */
export const ROOM = { width: 6, depth: 6, height: 2.8 } as const;

export const PLAYER_RADIUS = 0.3;

const HALF_WIDTH = ROOM.width / 2;
const HALF_DEPTH = ROOM.depth / 2;

export const WALK_BOUNDS: Footprint = {
  minX: -HALF_WIDTH + PLAYER_RADIUS,
  maxX: HALF_WIDTH - PLAYER_RADIUS,
  minZ: -HALF_DEPTH + PLAYER_RADIUS,
  maxZ: HALF_DEPTH - PLAYER_RADIUS,
};

const CAMERA_WALL_MARGIN = 0.15;

export const CAMERA_BOUNDS: Footprint = {
  minX: -HALF_WIDTH + CAMERA_WALL_MARGIN,
  maxX: HALF_WIDTH - CAMERA_WALL_MARGIN,
  minZ: -HALF_DEPTH + CAMERA_WALL_MARGIN,
  maxZ: HALF_DEPTH - CAMERA_WALL_MARGIN,
};

export const CRATE = { x: 1.7, z: -2.4, size: 0.8, reach: 1.4 } as const;
export const CRATE_CENTER: Vec2 = { x: CRATE.x, z: CRATE.z };

/** Taller than the follow camera, so it must also block the camera's line to the character. */
export const WARDROBE: Footprint = { minX: -3, maxX: -2.4, minZ: -1.9, maxZ: -0.3 };

/** Floor footprints of the geometry in RoomShell; keep the two in sync. */
export const OBSTACLES: readonly Footprint[] = [
  WARDROBE,
  { minX: -0.75, maxX: 0.75, minZ: -2.95, maxZ: -2.25 }, // desk
  { minX: -0.25, maxX: 0.25, minZ: -2.25, maxZ: -1.71 }, // chair
  { minX: -2.95, maxX: -1.95, minZ: 0.3, maxZ: 2.3 }, // bed
  { minX: 2.62, maxX: 2.98, minZ: -2.05, maxZ: -0.95 }, // bookshelf
  {
    minX: CRATE.x - CRATE.size / 2,
    maxX: CRATE.x + CRATE.size / 2,
    minZ: CRATE.z - CRATE.size / 2,
    maxZ: CRATE.z + CRATE.size / 2,
  },
];
