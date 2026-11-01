import { DemoState, PhotoRef, PROMPTS } from './types';

/**
 * Derived values. XP is computed from state flags — never independently
 * mutated — so duplicate callbacks cannot inflate progress.
 */
export function derivedXp(state: DemoState): number {
  const total =
    (state.eventId ? 20 : 0) +
    state.completedPrompts.length * 10 +
    (state.postPublished ? 40 : 0) +
    (state.standUpSubmitted ? 5 : 0);
  return Math.min(100, total);
}

/** True when at least one prompt has a real capture. */
export function anyPhoto(state: DemoState): boolean {
  return PROMPTS.some((p) => state.photos[p.id] !== null);
}

/** Captured photos in fixed prompt order (room → selfie → banner → handshake). */
export function photoList(state: DemoState): PhotoRef[] {
  return PROMPTS.filter((p) => state.photos[p.id] !== null).map((p) => ({
    promptId: p.id,
    url: state.photos[p.id] as string,
  }));
}

/** Mic (equippable) unlocks on the first real capture. */
export function micUnlocked(state: DemoState): boolean {
  return anyPhoto(state);
}

export function lightsUnlocked(state: DemoState): boolean {
  return state.postPublished;
}

export function badgeUnlocked(state: DemoState): boolean {
  return state.completedPrompts.length === 4;
}

/**
 * Gift gating (contract revision 2026-11-01): event selected + post
 * published. Photos are skippable — the demo is lighthearted, no hard
 * blockers. Stand-up XP alone still cannot open it.
 */
export function giftEligible(state: DemoState): boolean {
  return state.eventId !== null && state.postPublished;
}
