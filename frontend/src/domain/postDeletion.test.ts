import { describe, expect, it } from 'vitest';
import { demoReducer } from './reducer';
import { initialState } from './types';

describe('deleting a post', () => {
  it('clears the post and its draft but keeps other progress', () => {
    const state = { ...initialState, eventId: 'larphacks', postText: 'Published', postPublished: true,
      standUpSubmitted: true, composerDraft: { ...initialState.composerDraft, customDraft: 'private draft' } };
    const next = demoReducer(state, { type: 'DELETE_POST' });
    expect(next.postText).toBe('');
    expect(next.postPublished).toBe(false);
    expect(next.composerDraft).toEqual(initialState.composerDraft);
    expect(next.eventId).toBe('larphacks');
    expect(next.standUpSubmitted).toBe(true);
  });
});
