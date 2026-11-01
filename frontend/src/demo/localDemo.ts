import { DemoState } from '../domain/types';

const LOCAL_DEMO_KEY = 'larpedin-local-demo-state';

type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

export function loadLocalDemo(storage: StorageAccess): DemoState | null {
  try {
    const raw = storage.getItem(LOCAL_DEMO_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as DemoState;
    if (!state || typeof state !== 'object' || !state.photos || !state.selections ||
        !state.composerDraft || typeof state.currentScreen !== 'string') return null;
    return state;
  } catch {
    return null;
  }
}

export function saveLocalDemo(storage: StorageAccess, state: DemoState): void {
  storage.setItem(LOCAL_DEMO_KEY, JSON.stringify(state));
}
