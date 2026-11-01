/**
 * Shared types for the LarpedIn demo session.
 *
 * Note: `frontend/src/domain/*` is Andrew's (I2) ownership area. This file
 * implements the agreed contract so F1 can run; when his I2 commit lands
 * in integration, his version of this directory should win wholesale.
 *
 * Contract revision (2026-11-01, announced to Andrew): per-prompt photos
 * map (one capture per prompt, re-snap overwrites), no single photoUrl,
 * gift gate = event selected + post published (photos skippable).
 */

import { ItemId, SpotId } from './items';

export type PromptId = 'room' | 'selfie' | 'banner' | 'handshake';

export const PROMPTS: { id: PromptId; label: string; hint: string }[] = [
  { id: 'room', label: 'Full-room shot', hint: 'Frame the whole room — wide angle works best.' },
  { id: 'selfie', label: 'Selfie', hint: 'Front camera, confident first-year energy.' },
  { id: 'banner', label: 'Event banner', hint: 'Snap the banner or big screen so it is legible.' },
  { id: 'handshake', label: 'Handshake', hint: 'Ask a new connection to pose with you.' },
];

export interface ComposerInput {
  eventId: string;
  hookId: string;
  learningIds: [string, string, string];
  conclusionId: string;
  hashtagIds: string[];
  format?: 'legacy' | 'personal';
  customHook?: string;
  customConclusion?: string;
  moment?: string;
  person?: string;
  nextStep?: string;
}

export type ComposerTextSlot = 'hook' | 'moment' | 'person' | 'nextStep' | 'conclusion';
export type ComposerAnswer = { value: string; id?: string; custom: boolean };
export type ComposerDraft = {
  answers: Partial<Record<ComposerTextSlot, ComposerAnswer>>;
  hashtagIds: string[];
  active: ComposerTextSlot | 'hashtags';
  customOpen: boolean;
  customDraft: string;
};

export interface AiPreset {
  source: 'gemini' | 'fallback';
  hookId: string;
  learningIds: string[];
  conclusionId: string;
  hashtagIds: string[];
}

export interface DemoEvent {
  id: string;
  title: string;
  dateLabel: string;
  startAt?: string;
  venueLabel: string;
  url: string;
  featured: boolean;
  demoExample: boolean;
}

export interface Option {
  id: string;
  text: string;
}

export interface DemoData {
  schemaVersion: number;
  events: DemoEvent[];
  composer: {
    hooks: Option[];
    learnings: Option[];
    conclusions: Option[];
    hashtags: Option[];
  };
  profile: { id: string; name: string; headline: string };
  recruiter: { id: string; name: string; headline: string };
  outreachMessage: string;
}

export interface PhotoRef {
  promptId: PromptId;
  url: string;
}

export interface DemoState {
  currentScreen: 'dorm' | 'events' | 'camera' | 'trophies' | 'composer' | 'gift' | 'social';
  eventId: string | null;
  completedPrompts: PromptId[];
  /**
   * Data URL per prompt so captures can be restored from the saved demo state.
   * One capture per prompt; a re-snap overwrites the previous photo.
   */
  photos: Record<PromptId, string | null>;
  selections: {
    hookId: string | null;
    learningIds: string[];
    conclusionId: string | null;
    hashtagIds: string[];
  };
  composerInput: ComposerInput | null;
  composerDraft: ComposerDraft;
  postText: string;
  postPublished: boolean;
  /** Selected avatar variant (see AVATAR_ITEMS). Cosmetics only. */
  avatarItem: string;
  /** Placed room item ids (see ROOM_ITEMS). Static decor, toggleable. */
  roomItems: string[];
  standUpDraft: string;
  standUpSubmitted: boolean;
  /** Stand-up bullets, kept so the completed stand-up re-renders with its content. */
  standUpBullets: { bullet1: string; bullet2: string } | null;
  giftOpened: boolean;
  outreachSent: boolean;
  /** Which item sits in each dorm spot. An item occupies at most one spot. */
  placements: Partial<Record<SpotId, ItemId>>;
}

export type DemoAction =
  | { type: 'RESTORE_STATE'; state: DemoState }
  | { type: 'SET_CURRENT_SCREEN'; screen: DemoState['currentScreen'] }
  | { type: 'SELECT_EVENT'; eventId: string }
  | { type: 'CAPTURE'; dataUrl: string; promptId: PromptId }
  | { type: 'CHECK_PROMPT'; promptId: PromptId }
  | { type: 'SET_HOOK'; hookId: string }
  | { type: 'TOGGLE_LEARNING'; learningId: string }
  | { type: 'SET_CONCLUSION'; conclusionId: string }
  | { type: 'TOGGLE_HASHTAG'; hashtagId: string }
  | { type: 'SET_PRESET'; preset: { hookId: string; learningIds: string[]; conclusionId: string; hashtagIds: string[] } }
  | { type: 'SET_COMPOSER_INPUT'; input: ComposerInput }
  | { type: 'SET_COMPOSER_DRAFT'; draft: ComposerDraft }
  | { type: 'SET_POST_TEXT'; text: string }
  | { type: 'PUBLISH_POST' }
  | { type: 'DELETE_POST' }
  | { type: 'SUBMIT_STAND_UP'; bullet1: string; bullet2: string }
  | { type: 'SET_STAND_UP_DRAFT'; draft: string }
  | { type: 'SET_AVATAR_ITEM'; itemId: string }
  | { type: 'TOGGLE_ROOM_ITEM'; itemId: string }
  | { type: 'GIFT_ANIMATION_DONE' }
  | { type: 'PLACE_ITEM'; itemId: ItemId; spotId: SpotId }
  | { type: 'REMOVE_ITEM'; spotId: SpotId };

export const initialState: DemoState = {
  currentScreen: 'dorm',
  eventId: null,
  completedPrompts: [],
  photos: { room: null, selfie: null, banner: null, handshake: null },
  selections: { hookId: null, learningIds: [], conclusionId: null, hashtagIds: [] },
  composerInput: null,
  composerDraft: {
    answers: {}, hashtagIds: [], active: 'hook', customOpen: false, customDraft: '',
  },
  postText: '',
  postPublished: false,
  avatarItem: 'base',
  roomItems: [],
  standUpDraft: '',
  standUpSubmitted: false,
  standUpBullets: null,
  giftOpened: false,
  outreachSent: false,
  placements: {},
};
