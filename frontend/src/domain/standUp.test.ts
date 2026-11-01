import { describe, expect, it } from 'vitest';
import { hasStandUpToday, localDay, parseStandUpDraft } from './standUp';
import { StandUpPost, initialState } from './types';
import { demoReducer } from './reducer';
import { derivedXp } from './selectors';

const post: StandUpPost = { id: 1, createdAt: '2026-01-02T12:00:00Z', localDate: '2026-01-02', name: 'Sam', headline: 'Builder', win: 'Made it', nextStep: '', isOwn: true };

describe('daily stand-up', () => {
  it('parses current and legacy drafts without losing either answer', () => {
    expect(parseStandUpDraft(JSON.stringify({ win: 'Built', nextStep: 'Ship' }))).toEqual({ win: 'Built', nextStep: 'Ship' });
    expect(parseStandUpDraft('• Built\n• Ship')).toEqual({ win: 'Built', nextStep: 'Ship' });
  });
  it('only blocks the owner on the local date of their post', () => {
    const today = new Date(2026, 0, 2, 23, 59);
    expect(localDay(today)).toBe('2026-01-02');
    expect(hasStandUpToday([post], today)).toBe(true);
    expect(hasStandUpToday([{ ...post, isOwn: false }], today)).toBe(false);
    expect(hasStandUpToday([post], new Date(2026, 0, 3))).toBe(false);
    expect(hasStandUpToday([], today)).toBe(false);
  });
  it('awards stand-up XP once and retains it on subsequent submissions', () => {
    const first = demoReducer(initialState, { type: 'SUBMIT_STAND_UP', bullet1: 'Win', bullet2: '' });
    const second = demoReducer(first, { type: 'SUBMIT_STAND_UP', bullet1: 'Another', bullet2: '' });
    expect(derivedXp(first)).toBe(derivedXp(initialState) + 5);
    expect(second).toBe(first);
  });
});
