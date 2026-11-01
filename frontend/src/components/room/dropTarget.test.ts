import { describe, expect, it } from 'vitest';
import { Raycaster, Vector3 } from 'three';
import { findItem } from '../../domain/items';
import { findDropTarget } from './dropTarget';

describe('room item drop targets', () => {
  it('finds a compatible wall spot under the pointer ray', () => {
    const ray = new Raycaster(new Vector3(-1.5, 1.6, 0), new Vector3(0, 0, -1));
    expect(findDropTarget(findItem('stickers')!, ray)).toBe('wall-desk-left');
  });
  it('does not place an item on an incompatible surface or outside a target', () => {
    const ray = new Raycaster(new Vector3(-1.5, 1.6, 0), new Vector3(0, 0, -1));
    expect(findDropTarget(findItem('mug')!, ray)).toBeUndefined();
    const miss = new Raycaster(new Vector3(0, 0.1, 0), new Vector3(0, 0, -1));
    expect(findDropTarget(findItem('stickers')!, miss)).toBeUndefined();
  });
  it('distinguishes the new high and low wall targets', () => {
    const item = findItem('stickers')!;
    const high = new Raycaster(new Vector3(0, 1.9, 0), new Vector3(0, 0, -1));
    const low = new Raycaster(new Vector3(-2.15, 1.05, 0), new Vector3(0, 0, -1));
    expect(findDropTarget(item, high)).toBe('wall-desk-high-center');
    expect(findDropTarget(item, low)).toBe('wall-desk-low-left');
  });
});
