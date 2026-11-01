import { describe, expect, it } from 'vitest';
import { demoReducer } from './reducer';
import { unlockedItemIds } from './selectors';
import { initialState } from './types';

describe('unlockedItemIds', () => {
  it('starts with only the starter item', () => {
    expect(unlockedItemIds(initialState)).toEqual(['stickers']);
  });

  it('adds items as progress flags are set', () => {
    const state = { ...initialState, eventId: 'larphacks', standUpSubmitted: true, postPublished: true };
    expect(unlockedItemIds(state)).toEqual(['stickers', 'poster', 'mug', 'mousepad']);
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
