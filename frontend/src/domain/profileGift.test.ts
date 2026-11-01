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
  it('claims the gift without copying the current post into the message', () => {
    const posted = { ...initialState, postText: 'Original post', postPublished: true };
    const claimed = demoReducer(posted, { type: 'GIFT_ANIMATION_DONE', outcome: 'offer', replyAt: 12345 });
    expect(claimed.giftOpened).toBe(true);
    expect(claimed.outreachSent).toBe(true);
    expect(claimed.outreachPostText).toBe('');
    expect(claimed.postText).toBe('Original post');
    expect(claimed.recruiterReplyOutcome).toBe('offer');
    expect(claimed.recruiterReplyAt).toBe(12345);
    expect(demoReducer(claimed, { type: 'SCHEDULE_RECRUITER_REPLY', outcome: 'rejection', replyAt: 20000 })).toBe(claimed);
  });
  it('schedules a response once for an existing sent message', () => {
    const legacy = { ...initialState, outreachSent: true, giftOpened: true };
    const scheduled = demoReducer(legacy, { type: 'SCHEDULE_RECRUITER_REPLY', outcome: 'rejection', replyAt: 12345 });
    expect(scheduled.recruiterReplyOutcome).toBe('rejection');
    expect(demoReducer(scheduled, { type: 'SCHEDULE_RECRUITER_REPLY', outcome: 'offer', replyAt: 20000 })).toBe(scheduled);
  });
});
