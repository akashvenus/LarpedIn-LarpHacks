import { describe, expect, it } from 'vitest';
import { shouldDismissInventory } from './inventorySwipe';

describe('inventory swipe', () => {
  it('dismisses on a deliberate downward drag', () => {
    expect(shouldDismissInventory(100, 100, 110, 180)).toBe(true);
  });
  it('ignores short, upward, and mostly horizontal gestures', () => {
    expect(shouldDismissInventory(100, 100, 100, 160)).toBe(false);
    expect(shouldDismissInventory(100, 100, 100, 0)).toBe(false);
    expect(shouldDismissInventory(100, 100, 200, 180)).toBe(false);
  });
});
