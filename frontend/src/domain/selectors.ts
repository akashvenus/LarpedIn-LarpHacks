import { DemoState } from './types';

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

export function micUnlocked(state: DemoState): boolean {
  return state.capturedPromptId !== null;
}

export function lightsUnlocked(state: DemoState): boolean {
  return state.postPublished;
}

export function badgeUnlocked(state: DemoState): boolean {
  return state.completedPrompts.length === 4;
}

/**
 * Gift gating uses required task flags, not XP alone: an event must be
 * selected, a real photo must exist, all four prompts must be complete,
 * and the post must be published. Stand-up XP alone can never open it.
 */
export function giftEligible(state: DemoState): boolean {
  return (
    state.eventId !== null &&
    state.photoUrl !== null &&
    state.capturedPromptId !== null &&
    state.completedPrompts.length === 4 &&
    state.postPublished
  );
}
