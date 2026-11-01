import { describe, expect, it } from 'vitest';
import { demoReducer } from './reducer';
import { initialState } from './types';

describe('profile and claimed gift', () => {
  it('trims the onboarding profile and only selects captured photos', () => {
    const named = demoReducer(initialState, { type: 'SET_PROFILE', name: ' Sam ', occupation: ' Developer ' });
    expect(named.name).toBe('Sam');
    expect(named.occupation).toBe('Developer');
    expect(demoReducer(named, { type: 'SET_PROFILE_PHOTO', promptId: 'selfie' })).toBe(named);
    const withPhoto = { ...named, photos: { ...named.photos, selfie: 'data:image/jpeg;base64,abc' } };
    expect(demoReducer(withPhoto, { type: 'SET_PROFILE_PHOTO', promptId: 'selfie' }).profilePhoto).toBe('selfie');
  });
  it('sends the current post when the gift is claimed and keeps that snapshot', () => {
    const posted = { ...initialState, postText: 'Original post', postPublished: true };
    const claimed = demoReducer(posted, { type: 'GIFT_ANIMATION_DONE' });
    expect(claimed.giftOpened).toBe(true);
    expect(claimed.outreachSent).toBe(true);
    expect(claimed.outreachPostText).toBe('Original post');
    expect(demoReducer(claimed, { type: 'SET_POST_TEXT', text: 'Edited post' }).outreachPostText).toBe('Original post');
  });
});
