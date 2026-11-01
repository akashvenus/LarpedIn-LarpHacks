export interface Vec2 {
  x: number;
  z: number;
}

/** Axis-aligned footprint on the floor plane. */
export interface Footprint {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function overlaps(point: Vec2, radius: number, box: Footprint): boolean {
  return (
    point.x > box.minX - radius &&
    point.x < box.maxX + radius &&
    point.z > box.minZ - radius &&
    point.z < box.maxZ + radius
  );
}

/**
 * Moves one axis at a time so a blocked diagonal slides along the obstacle.
 * bounds is the walkable area for the character's centre, already inset by radius.
 */
export function moveWithCollisions(
  from: Vec2,
  delta: Vec2,
  radius: number,
  bounds: Footprint,
  obstacles: readonly Footprint[],
): Vec2 {
  const isBlocked = (point: Vec2) => obstacles.some((box) => overlaps(point, radius, box));

  const stepX = { x: Math.min(bounds.maxX, Math.max(bounds.minX, from.x + delta.x)), z: from.z };
  const afterX = isBlocked(stepX) ? from : stepX;
  const stepZ = { x: afterX.x, z: Math.min(bounds.maxZ, Math.max(bounds.minZ, afterX.z + delta.z)) };
  return isBlocked(stepZ) ? afterX : stepZ;
}

/** Converts stick input (x: right, y: forward) to a world-space direction for a camera at yaw. */
export function worldDirection(input: { x: number; y: number }, yaw: number): Vec2 {
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  return {
    x: input.x * cos - input.y * sin,
    z: -input.x * sin - input.y * cos,
  };
}

/** Yaw that points the character, whose model faces +z, along direction. */
export function headingOf(direction: Vec2): number {
  return Math.atan2(direction.x, direction.z);
}

/** Fraction of the remaining distance to cover this frame; independent of frame rate. */
export function dampFactor(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

/** Eases an angle toward target along the shorter way round. The result is not wrapped. */
export function dampAngle(current: number, target: number, rate: number, dt: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * dampFactor(rate, dt);
}

export function dampVelocity(current: Vec2, target: Vec2, rate: number, dt: number): Vec2 {
  const factor = dampFactor(rate, dt);
  return {
    x: current.x + (target.x - current.x) * factor,
    z: current.z + (target.z - current.z) * factor,
  };
}

const CAMERA_PROBE_STEPS = 16;

/**
 * Longest camera distance from target along direction (a unit vector) that stays inside
 * bounds and out of the obstacles. The minimum keeps the camera off the character.
 */
export function clearCameraDistance(
  target: Vec2,
  direction: Vec2,
  maxDistance: number,
  minDistance: number,
  bounds: Footprint,
  obstacles: readonly Footprint[],
): number {
  let clear = minDistance;
  for (let i = 1; i <= CAMERA_PROBE_STEPS; i++) {
    const distance = minDistance + ((maxDistance - minDistance) * i) / CAMERA_PROBE_STEPS;
    const point = { x: target.x + direction.x * distance, z: target.z + direction.z * distance };
    const isOutside =
      point.x < bounds.minX || point.x > bounds.maxX || point.z < bounds.minZ || point.z > bounds.maxZ;
    if (isOutside || obstacles.some((box) => overlaps(point, 0, box))) break;
    clear = distance;
  }
  return clear;
}

export function isWithin(a: Vec2, b: Vec2, distance: number): boolean {
  return Math.hypot(a.x - b.x, a.z - b.z) <= distance;
}

/** Keyboard codes mapped to stick axes; opposing keys cancel and the result never exceeds length 1. */
export function moveVector(keys: ReadonlySet<string>, stick: { x: number; y: number }): { x: number; y: number } {
  const x = stick.x + (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  const y = stick.y + (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  const length = Math.hypot(x, y);
  return length > 1 ? { x: x / length, y: y / length } : { x, y };
}
