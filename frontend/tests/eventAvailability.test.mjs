import { describe, expect, it } from 'vitest';
import { eventLocked } from '../src/domain/eventAvailability.ts';

describe('event availability', () => {
  it('unlocks events at their start time and keeps unknown dates locked', () => {
    const event = { featured: false, startAt: '2026-11-05T17:30:00-05:00' };
    const start = Date.parse(event.startAt);
    expect(eventLocked(event, start - 1)).toBe(true);
    expect(eventLocked(event, start)).toBe(false);
    expect(eventLocked({ featured: false }, start)).toBe(true);
    expect(eventLocked({ featured: false, startAt: 'invalid' }, start)).toBe(true);
    expect(eventLocked({ featured: true }, start)).toBe(false);
  });
});
