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
    case 'SELECT_EVENT':
      if (state.eventId === action.eventId) return state;
      return { ...state, eventId: action.eventId };

    case 'CAPTURE': {
      // Idempotent: re-capturing the same already-completed prompt is a no-op.
      if (
        state.capturedPromptId === action.promptId &&
        state.completedPrompts.includes(action.promptId)
      ) {
        return state;
      }
      const completed = state.completedPrompts.includes(action.promptId)
        ? state.completedPrompts
        : [...state.completedPrompts, action.promptId];
      if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
      return {
        ...state,
        completedPrompts: completed,
        capturedPromptId: action.promptId,
        photoUrl: URL.createObjectURL(action.blob),
      };
    }

    case 'REVOKE_PHOTO': {
      if (!state.photoUrl || !state.capturedPromptId) return state;
      URL.revokeObjectURL(state.photoUrl);
      const released = state.capturedPromptId;
      return {
        ...state,
        photoUrl: null,
        capturedPromptId: null,
        completedPrompts: state.completedPrompts.filter((p) => p !== released),
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

    case 'SET_POST_TEXT':
      if (state.postText === action.text) return state;
      return { ...state, postText: action.text };

    case 'PUBLISH_POST':
      if (state.postPublished || !state.postText.trim()) return state;
      return { ...state, postPublished: true };

    case 'SUBMIT_STAND_UP':
      if (state.standUpSubmitted) return state;
      return { ...state, standUpSubmitted: true };

    case 'GIFT_ANIMATION_DONE':
      // One callback: mark the gift open and send the simulated message.
      if (state.giftOpened) return state;
      return { ...state, giftOpened: true, outreachSent: true };
  }
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export { initialState };
