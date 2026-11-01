import { test } from 'vitest';
import assert from 'node:assert/strict';
import { eventLocked } from '../src/domain/eventAvailability.ts';

test('events unlock at their start time and unknown dates stay locked', () => {
  const event = { featured: false, startAt: '2026-11-05T17:30:00-05:00' };
  const start = Date.parse(event.startAt);
  assert.equal(eventLocked(event, start - 1), true);
  assert.equal(eventLocked(event, start), false);
  assert.equal(eventLocked({ featured: false }, start), true);
  assert.equal(eventLocked({ featured: false, startAt: 'invalid' }, start), true);
  assert.equal(eventLocked({ featured: true }, start), false);
});
