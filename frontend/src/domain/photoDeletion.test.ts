import { describe, expect, it } from 'vitest';
import { demoReducer } from './reducer';
import { derivedXp, photoList } from './selectors';
import { initialState } from './types';

describe('photo deletion', () => {
  it('removes only the selected photo and clears it as the profile photo without undoing earned XP', () => {
    const first = demoReducer(initialState, { type: 'CAPTURE', promptId: 'selfie', dataUrl: 'selfie-data' });
    const second = demoReducer(first, { type: 'CAPTURE', promptId: 'room', dataUrl: 'room-data' });
    const selected = demoReducer(second, { type: 'SET_PROFILE_PHOTO', promptId: 'selfie' });
    const next = demoReducer(selected, { type: 'DELETE_PHOTO', promptId: 'selfie' });
    expect(next.photos.selfie).toBeNull();
    expect(next.photos.room).toBe('room-data');
    expect(next.profilePhoto).toBeNull();
    expect(photoList(next)).toHaveLength(1);
    expect(derivedXp(next)).toBe(derivedXp(selected));
    expect(demoReducer(next, { type: 'DELETE_PHOTO', promptId: 'selfie' })).toBe(next);
  });
});
