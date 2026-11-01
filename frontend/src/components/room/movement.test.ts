import { describe, expect, it } from 'vitest';
import { clearCameraDistance, isWithin, moveVector, moveWithCollisions, worldDirection } from './movement';

const BOUNDS = { minX: -2, maxX: 2, minZ: -2, maxZ: 2 };
const BOX = { minX: 0, maxX: 1, minZ: -1, maxZ: 1 };

describe('moveWithCollisions', () => {
  it('moves freely in open space', () => {
    expect(moveWithCollisions({ x: -1, z: 0 }, { x: 0.1, z: 0.2 }, 0.1, BOUNDS, [])).toEqual({ x: -0.9, z: 0.2 });
  });

  it('stops at the room bounds', () => {
    expect(moveWithCollisions({ x: 1.9, z: 0 }, { x: 0.5, z: 0 }, 0.1, BOUNDS, [])).toEqual({ x: 2, z: 0 });
  });

  it('does not enter an obstacle', () => {
    expect(moveWithCollisions({ x: -0.2, z: 0 }, { x: 0.15, z: 0 }, 0.1, BOUNDS, [BOX])).toEqual({ x: -0.2, z: 0 });
  });

  it('slides along an obstacle on a diagonal', () => {
    const next = moveWithCollisions({ x: -0.2, z: 0 }, { x: 0.15, z: 0.3 }, 0.1, BOUNDS, [BOX]);
    expect(next).toEqual({ x: -0.2, z: 0.3 });
  });
});

describe('worldDirection', () => {
  it('walks away from a camera at yaw 0, which sits on +z', () => {
    const dir = worldDirection({ x: 0, y: 1 }, 0);
    expect(dir.x).toBeCloseTo(0);
    expect(dir.z).toBeCloseTo(-1);
  });

  it('strafes to the screen right at yaw 0', () => {
    const dir = worldDirection({ x: 1, y: 0 }, 0);
    expect(dir.x).toBeCloseTo(1);
    expect(dir.z).toBeCloseTo(0);
  });

  it('follows the camera when it rotates to +x', () => {
    const dir = worldDirection({ x: 0, y: 1 }, Math.PI / 2);
    expect(dir.x).toBeCloseTo(-1);
    expect(dir.z).toBeCloseTo(0);
  });
});

describe('clearCameraDistance', () => {
  it('returns the full distance when nothing is in the way', () => {
    expect(clearCameraDistance({ x: 0, z: 0 }, { x: 0, z: 1 }, 1.5, 0.5, BOUNDS, [])).toBeCloseTo(1.5);
  });

  it('pulls in before a wall', () => {
    const distance = clearCameraDistance({ x: 0, z: 1.5 }, { x: 0, z: 1 }, 2, 0.1, BOUNDS, []);
    expect(distance).toBeLessThanOrEqual(0.5);
  });

  it('pulls in before an obstacle', () => {
    const distance = clearCameraDistance({ x: -1, z: 0 }, { x: 1, z: 0 }, 2.5, 0.1, BOUNDS, [BOX]);
    expect(distance).toBeLessThanOrEqual(1);
  });

  it('never goes below the minimum', () => {
    expect(clearCameraDistance({ x: 2, z: 0 }, { x: 1, z: 0 }, 2, 0.4, BOUNDS, [])).toBe(0.4);
  });
});

describe('moveVector', () => {
  it('normalises diagonal keys', () => {
    const v = moveVector(new Set(['KeyW', 'KeyD']), { x: 0, y: 0 });
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
  });

  it('cancels opposing keys', () => {
    expect(moveVector(new Set(['KeyW', 'KeyS']), { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('keeps partial stick input for slow walking', () => {
    expect(moveVector(new Set(), { x: 0, y: 0.4 })).toEqual({ x: 0, y: 0.4 });
  });
});

describe('isWithin', () => {
  it('includes the boundary', () => {
    expect(isWithin({ x: 0, z: 0 }, { x: 3, z: 4 }, 5)).toBe(true);
    expect(isWithin({ x: 0, z: 0 }, { x: 3, z: 4 }, 4.9)).toBe(false);
  });
});
