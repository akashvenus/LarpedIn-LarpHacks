import { findItem, findSpot } from './items';
import { derivedXp, unlockedItemIds } from './selectors';
import { ACCESSORIES, HELD_PROPS } from './gear';
import {
  DemoAction,
  DemoState,
  initialState,
  PROMPTS,
} from './types';

/**
 * Pure session reducer for the LarpedIn demo.
 *
 * Ownership note: `frontend/src/domain/*` is Andrew's (I2). This implements
 * his locked spec so the app can run; his I2 commit should replace this
 * directory wholesale at integration.
 *
 * All actions are idempotent: repeated selects, checks, publish, stand-up,
 * and animation callbacks can never add XP or fire twice. XP is derived
 * (see selectors.ts), never mutated here. No browser storage is touched.
 */
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'RESTORE_STATE':
      return { ...initialState, ...action.state };

    case 'SET_CURRENT_SCREEN':
      if (state.currentScreen === action.screen) return state;
      return { ...state, currentScreen: action.screen };

    case 'SET_PROFILE':
      return { ...state, name: action.name.trim(), occupation: action.occupation.trim() };

    case 'SET_PROFILE_PHOTO':
      if (!state.photos[action.promptId]) return state;
      return { ...state, profilePhoto: action.promptId };

    case 'SELECT_EVENT':
      if (state.eventId === action.eventId) return state;
      return { ...state, eventId: action.eventId };

    case 'CAPTURE': {
      // XP is derived from completedPrompts (a set), so repeated snaps
      // can never add XP twice. Data URLs survive database round-trips.
      const completed = state.completedPrompts.includes(action.promptId)
        ? state.completedPrompts
        : [...state.completedPrompts, action.promptId];
      return {
        ...state,
        completedPrompts: completed,
        photos: {
          ...state.photos,
          [action.promptId]: action.dataUrl,
        },
      };
    }

    case 'CHECK_PROMPT':
      if (
        state.completedPrompts.includes(action.promptId) ||
        !PROMPTS.some((p) => p.id === action.promptId)
      ) {
        return state;
      }
      return { ...state, completedPrompts: [...state.completedPrompts, action.promptId] };

    case 'SET_HOOK':
      if (state.selections.hookId === action.hookId) return state;
      return { ...state, selections: { ...state.selections, hookId: action.hookId } };

    case 'TOGGLE_LEARNING': {
      const has = state.selections.learningIds.includes(action.learningId);
      if (has) {
        return {
          ...state,
          selections: {
            ...state.selections,
            learningIds: state.selections.learningIds.filter((id) => id !== action.learningId),
          },
        };
      }
      if (state.selections.learningIds.length >= 3) return state;
      return {
        ...state,
        selections: {
          ...state.selections,
          learningIds: [...state.selections.learningIds, action.learningId],
        },
      };
    }

    case 'SET_CONCLUSION':
      if (state.selections.conclusionId === action.conclusionId) return state;
      return {
        ...state,
        selections: { ...state.selections, conclusionId: action.conclusionId },
      };

    case 'TOGGLE_HASHTAG': {
      const has = state.selections.hashtagIds.includes(action.hashtagId);
      if (has) {
        return {
          ...state,
          selections: {
            ...state.selections,
            hashtagIds: state.selections.hashtagIds.filter((id) => id !== action.hashtagId),
          },
        };
      }
      if (state.selections.hashtagIds.length >= 3) return state;
      return {
        ...state,
        selections: {
          ...state.selections,
          hashtagIds: [...state.selections.hashtagIds, action.hashtagId],
        },
      };
    }

    case 'SET_PRESET': {
      const learningIds = action.preset.learningIds.slice(0, 3);
      const hashtagIds = action.preset.hashtagIds.slice(0, 3);
      if (
        state.selections.hookId === action.preset.hookId &&
        state.selections.conclusionId === action.preset.conclusionId &&
        sameIds(state.selections.learningIds, learningIds) &&
        sameIds(state.selections.hashtagIds, hashtagIds)
      ) {
        return state;
      }
      return {
        ...state,
        selections: {
          hookId: action.preset.hookId,
          learningIds,
          conclusionId: action.preset.conclusionId,
          hashtagIds,
        },
      };
    }

    case 'SET_COMPOSER_INPUT':
      return {
        ...state,
        eventId: action.input.eventId,
        composerInput: action.input,
        selections: {
          hookId: action.input.hookId,
          learningIds: [...action.input.learningIds],
          conclusionId: action.input.conclusionId,
          hashtagIds: [...action.input.hashtagIds],
        },
      };

    case 'SET_COMPOSER_DRAFT':
      if (JSON.stringify(state.composerDraft) === JSON.stringify(action.draft)) return state;
      return { ...state, composerDraft: action.draft };

    case 'SET_POST_TEXT':
      if (state.postText === action.text) return state;
      return { ...state, postText: action.text };

    case 'PUBLISH_POST':
      if (state.postPublished || !state.postText.trim()) return state;
      return { ...state, postPublished: true };

    case 'DELETE_POST':
      return { ...state, postText: '', postPublished: false, composerInput: null, composerDraft: initialState.composerDraft, selections: initialState.selections };

    case 'SUBMIT_STAND_UP':
      if (state.standUpSubmitted) return state;
      return {
        ...state,
        standUpSubmitted: true,
        standUpBullets: { bullet1: action.bullet1, bullet2: action.bullet2 },
      };

    case 'SET_STAND_UP_DRAFT':
      if (state.standUpDraft === action.draft) return state;
      return { ...state, standUpDraft: action.draft };

    case 'GIFT_ANIMATION_DONE':
      // One callback: mark the gift open and send the simulated message.
      if (state.giftOpened) return state;
      return { ...state, giftOpened: true, outreachSent: true, outreachPostText: '' };

    case 'PLACE_ITEM': {
      const item = findItem(action.itemId);
      const spot = findSpot(action.spotId);
      if (!item || !spot || item.surface !== spot.surface) return state;
      if (!unlockedItemIds(state).includes(item.id)) return state;
      if (state.placements[spot.id] === item.id) return state;
      const others = Object.entries(state.placements).filter(([, id]) => id !== item.id);
      return {
        ...state,
        placements: { ...Object.fromEntries(others), [spot.id]: item.id },
      };
    }

    case 'REMOVE_ITEM': {
      if (!state.placements[action.spotId]) return state;
      const remaining = Object.entries(state.placements).filter(([id]) => id !== action.spotId);
      return { ...state, placements: Object.fromEntries(remaining) };
    }

    case 'SET_ACCESSORY':
      if (action.itemId && !ACCESSORIES.some((item) => item.id === action.itemId && item.unlockXp <= derivedXp(state))) return state;
      return { ...state, accessory: action.itemId };

    case 'SET_HELD_PROP':
      if (action.itemId && !HELD_PROPS.some((item) => item.id === action.itemId && item.unlockXp <= derivedXp(state))) return state;
      return { ...state, heldProp: action.itemId };

    case 'SET_AVATAR_ITEM':
      if (state.avatarItem === action.itemId) return state;
      return { ...state, avatarItem: action.itemId };

    case 'TOGGLE_ROOM_ITEM': {
      const placed = state.roomItems.includes(action.itemId);
      return {
        ...state,
        roomItems: placed
          ? state.roomItems.filter((id) => id !== action.itemId)
          : [...state.roomItems, action.itemId],
      };
    }
  }
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export { initialState };
