import { describe, expect, it } from 'vitest';
import { speakerStrapAngle } from './speakerBadge';

describe('speaker badge straps', () => {
  it('angles each strap from the shoulders inward toward the badge', () => {
    for (const side of [-1, 1]) {
      const centerX = side * 0.065;
      const horizontal = Math.sin(speakerStrapAngle(side)) * 0.09;
      const shoulderX = centerX - horizontal;
      const badgeX = centerX + horizontal;
      expect(Math.abs(shoulderX)).toBeGreaterThan(Math.abs(badgeX));
    }
  });
});
