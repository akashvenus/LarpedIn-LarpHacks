import { describe, expect, it } from 'vitest';
import { nextJourneyStep } from './selectors';
import { initialState, PROMPTS } from './types';

describe('next journey step', () => {
  it('guides a new user through one step at a time', () => {
    const event = { ...initialState, eventId: 'larphacks' };
    expect(nextJourneyStep(initialState, true, false)).toBe('standup');
    expect(nextJourneyStep({ ...initialState, standUpSubmitted: true }, true, true)).toBe('events');
    expect(nextJourneyStep(event, true, false)).toBe('standup');
    expect(nextJourneyStep({ ...event, standUpSubmitted: true }, true, true)).toBe('camera');
    const photos = { ...event, standUpSubmitted: true, completedPrompts: PROMPTS.map((prompt) => prompt.id) };
    expect(nextJourneyStep(photos, true, true)).toBe('composer');
    expect(nextJourneyStep({ ...photos, postText: 'Draft' }, true, true)).toBe('social');
  });
  it('continues guiding users who skipped photos or cannot load stand-ups', () => {
    const event = { ...initialState, eventId: 'larphacks' };
    expect(nextJourneyStep(initialState, false, false)).toBe('events');
    expect(nextJourneyStep(event, false, false)).toBe('camera');
    expect(nextJourneyStep({ ...event, postPublished: true, standUpSubmitted: true }, true, true)).toBe('camera');
  });
  it('hides the prompt at maximum XP', () => {
    const complete = { ...initialState, eventId: 'larphacks', postPublished: true, completedPrompts: PROMPTS.map((prompt) => prompt.id) };
    expect(nextJourneyStep(complete, true, false)).toBeNull();
  });
});
