import { describe, expect, it } from 'vitest';
import { initialState } from '../domain/types';
import { loadLocalDemo, saveLocalDemo } from './localDemo';

describe('local demo progress', () => {
  it('restores the profile, photos, post, and screen on reload', () => {
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    const state = { ...initialState, name: 'Sam', occupation: 'Designer', currentScreen: 'social' as const,
      postText: 'My demo post', postPublished: true,
      photos: { ...initialState.photos, selfie: 'data:image/jpeg;base64,abc' } };
    saveLocalDemo(storage, state);
    expect(loadLocalDemo(storage)).toEqual(state);
  });

  it('starts fresh if saved data is malformed or storage is blocked', () => {
    expect(loadLocalDemo({ getItem: () => '{broken', setItem: () => {} })).toBeNull();
    expect(loadLocalDemo({ getItem: () => { throw new Error('blocked'); }, setItem: () => {} })).toBeNull();
    expect(loadLocalDemo({ getItem: () => '{}', setItem: () => {} })).toBeNull();
  });

  it('reports save failures so the app can warn without blocking the session', () => {
    expect(() => saveLocalDemo({ getItem: () => null, setItem: () => { throw new Error('full'); } }, initialState)).toThrow('full');
  });
});
