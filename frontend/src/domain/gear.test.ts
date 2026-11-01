import { describe, expect, it } from 'vitest';
import { demoReducer } from './reducer';
import { initialState } from './types';

describe('wearable and handheld items', () => {
  it('keeps outfit, wearable, and prop independent once unlocked', () => {
    const progress = { ...initialState, eventId: 'larphacks', avatarItem: 'hoodie-uoft' };
    const glasses = demoReducer(progress, { type: 'SET_ACCESSORY', itemId: 'glasses' });
    const coffee = demoReducer(glasses, { type: 'SET_HELD_PROP', itemId: 'coffee' });
    expect(coffee.avatarItem).toBe('hoodie-uoft');
    expect(coffee.accessory).toBe('glasses');
    expect(coffee.heldProp).toBe('coffee');
    expect(demoReducer(coffee, { type: 'SET_ACCESSORY', itemId: null }).heldProp).toBe('coffee');
  });
  it('equips the propeller cap without changing the outfit or held item', () => {
    const before = { ...initialState, avatarItem: 'hoodie-uoft', heldProp: 'coffee' as const };
    const after = demoReducer(before, { type: 'SET_ACCESSORY', itemId: 'propeller-cap' });
    expect(after.accessory).toBe('propeller-cap');
    expect(after.avatarItem).toBe('hoodie-uoft');
    expect(after.heldProp).toBe('coffee');
  });
  it('does not equip locked items before earning XP', () => {
    expect(demoReducer(initialState, { type: 'SET_HELD_PROP', itemId: 'pitch-deck' })).toBe(initialState);
    expect(demoReducer(initialState, { type: 'SET_ACCESSORY', itemId: 'lanyard' })).toBe(initialState);
  });
  it('restores older saved progress with empty gear slots', () => {
    const old = { ...initialState };
    const saved = { ...old } as Partial<typeof old>;
    delete saved.accessory;
    delete saved.heldProp;
    const restored = demoReducer(initialState, { type: 'RESTORE_STATE', state: saved as typeof old });
    expect(restored.accessory).toBeNull();
    expect(restored.heldProp).toBeNull();
  });
});
