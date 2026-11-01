import { describe, expect, it } from 'vitest';
import { demoReducer } from './reducer';
import { unlockedItemIds } from './selectors';
import { initialState } from './types';
import { ITEMS_BY_UNLOCK } from './items';

it('orders room items by the progress needed to unlock them', () => {
  expect(ITEMS_BY_UNLOCK.map((item) => item.id)).toEqual([
    'stickers', 'notes', 'mug', 'plant', 'books', 'poster', 'pivot', 'whiteboard', 'mousepad', 'vision',
  ]);
});

describe('unlockedItemIds', () => {
  it('starts with only the starter item', () => {
    expect(unlockedItemIds(initialState)).toEqual(['sama-lisa', 'stickers', 'notes']);
  });

  it('adds items as progress flags are set', () => {
    const state = { ...initialState, eventId: 'larphacks', standUpSubmitted: true, postPublished: true };
    expect(unlockedItemIds(state)).toEqual(['sama-lisa', 'stickers', 'poster', 'mug', 'mousepad', 'notes', 'pivot', 'vision', 'whiteboard', 'plant', 'books']);
  });
});

describe('PLACE_ITEM', () => {
  it('puts an unlocked item in a matching spot', () => {
    const next = demoReducer(initialState, { type: 'PLACE_ITEM', itemId: 'stickers', spotId: 'wall-bed' });
    expect(next.placements).toEqual({ 'wall-bed': 'stickers' });
  });

  it('rejects a locked item', () => {
    const next = demoReducer(initialState, { type: 'PLACE_ITEM', itemId: 'poster', spotId: 'wall-bed' });
    expect(next).toBe(initialState);
  });

  it('rejects a spot on the wrong surface', () => {
    const next = demoReducer(initialState, { type: 'PLACE_ITEM', itemId: 'stickers', spotId: 'desk-left' });
    expect(next).toBe(initialState);
  });

  it('moves an item instead of duplicating it', () => {
    const placed = demoReducer(initialState, { type: 'PLACE_ITEM', itemId: 'stickers', spotId: 'wall-bed' });
    const moved = demoReducer(placed, { type: 'PLACE_ITEM', itemId: 'stickers', spotId: 'wall-window' });
    expect(moved.placements).toEqual({ 'wall-window': 'stickers' });
  });

  it('replaces the previous occupant of a spot', () => {
    const start = { ...initialState, eventId: 'larphacks', placements: { 'wall-bed': 'stickers' as const } };
    const next = demoReducer(start, { type: 'PLACE_ITEM', itemId: 'poster', spotId: 'wall-bed' });
    expect(next.placements).toEqual({ 'wall-bed': 'poster' });
  });

  it('does not mutate the previous state', () => {
    const placed = demoReducer(initialState, { type: 'PLACE_ITEM', itemId: 'stickers', spotId: 'wall-bed' });
    demoReducer(placed, { type: 'REMOVE_ITEM', spotId: 'wall-bed' });
    expect(placed.placements).toEqual({ 'wall-bed': 'stickers' });
  });
});

describe('REMOVE_ITEM', () => {
  it('clears the spot', () => {
    const placed = demoReducer(initialState, { type: 'PLACE_ITEM', itemId: 'stickers', spotId: 'wall-bed' });
    expect(demoReducer(placed, { type: 'REMOVE_ITEM', spotId: 'wall-bed' }).placements).toEqual({});
  });

  it('returns the same state for an empty spot', () => {
    expect(demoReducer(initialState, { type: 'REMOVE_ITEM', spotId: 'wall-bed' })).toBe(initialState);
  });
});

describe('additional room locations', () => {
  it('places items at different wall heights without changing existing placements', () => {
    const existing = demoReducer(initialState, { type: 'PLACE_ITEM', itemId: 'stickers', spotId: 'wall-bed' });
    const high = demoReducer(existing, { type: 'PLACE_ITEM', itemId: 'notes', spotId: 'wall-desk-high-center' });
    const low = demoReducer(high, { type: 'PLACE_ITEM', itemId: 'notes', spotId: 'wall-back-low-left' });
    expect(low.placements).toEqual({ 'wall-bed': 'stickers', 'wall-back-low-left': 'notes' });
  });
  it('places desk items on the shelf, bed, or box and wall items beyond the window', () => {
    const start = { ...initialState, eventId: 'larphacks', standUpSubmitted: true };
    const shelf = demoReducer(start, { type: 'PLACE_ITEM', itemId: 'plant', spotId: 'shelf-top' });
    const bed = demoReducer(shelf, { type: 'PLACE_ITEM', itemId: 'books', spotId: 'bed-foot' });
    const box = demoReducer(bed, { type: 'PLACE_ITEM', itemId: 'mug', spotId: 'box-top' });
    const wall = demoReducer(box, { type: 'PLACE_ITEM', itemId: 'notes', spotId: 'wall-window-far' });
    expect(wall.placements).toMatchObject({ 'shelf-top': 'plant', 'bed-foot': 'books', 'box-top': 'mug', 'wall-window-far': 'notes' });
  });

  it('still rejects incompatible surfaces at the new locations', () => {
    expect(demoReducer(initialState, { type: 'PLACE_ITEM', itemId: 'notes', spotId: 'shelf-top' })).toBe(initialState);
  });
});
