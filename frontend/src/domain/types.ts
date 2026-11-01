/**
 * Shared types for the LarpedIn demo session.
 *
 * Note: `frontend/src/domain/*` is Andrew's (I2) ownership area. This file
 * implements his locked spec exactly so F1 can run; when his I2 commit lands
 * in integration, his version of this directory should win wholesale.
 */

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
}

export interface DemoEvent {
  id: string;
  title: string;
  dateLabel: string;
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

export interface DemoState {
  eventId: string | null;
  completedPrompts: PromptId[];
  capturedPromptId: PromptId | null;
  /** Object URL held only in memory; never persisted or uploaded. */
  photoUrl: string | null;
  selections: {
    hookId: string | null;
    learningIds: string[];
    conclusionId: string | null;
    hashtagIds: string[];
  };
  postText: string;
  postPublished: boolean;
  standUpSubmitted: boolean;
  /** Stand-up bullets, kept so the completed stand-up re-renders with its content. */
  standUpBullets: { bullet1: string; bullet2: string } | null;
  giftOpened: boolean;
  outreachSent: boolean;
}

export type DemoAction =
  | { type: 'SELECT_EVENT'; eventId: string }
  | { type: 'CAPTURE'; blob: Blob; promptId: PromptId }
  | { type: 'REVOKE_PHOTO' }
  | { type: 'CHECK_PROMPT'; promptId: PromptId }
  | { type: 'SET_HOOK'; hookId: string }
  | { type: 'TOGGLE_LEARNING'; learningId: string }
  | { type: 'SET_CONCLUSION'; conclusionId: string }
  | { type: 'TOGGLE_HASHTAG'; hashtagId: string }
  | { type: 'SET_PRESET'; preset: { hookId: string; learningIds: string[]; conclusionId: string; hashtagIds: string[] } }
  | { type: 'SET_POST_TEXT'; text: string }
  | { type: 'PUBLISH_POST' }
  | { type: 'SUBMIT_STAND_UP'; bullet1: string; bullet2: string }
  | { type: 'GIFT_ANIMATION_DONE' };

export const initialState: DemoState = {
  eventId: null,
  completedPrompts: [],
  capturedPromptId: null,
  photoUrl: null,
  selections: { hookId: null, learningIds: [], conclusionId: null, hashtagIds: [] },
  postText: '',
  postPublished: false,
  standUpSubmitted: false,
  standUpBullets: null,
  giftOpened: false,
  outreachSent: false,
};
