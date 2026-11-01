import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  compose,
  fetchAiPreset,
  fetchDemo,
  fetchDemoState,
  getBrowserClientId,
  localCompose,
  saveDemoState,
  saveUserPost,
  deleteUserPost,
} from './api';
import { CameraGuide } from './components/CameraGuide';
import { Dorm } from './components/Dorm';
import { Events } from './components/Events';
import { GiftReveal } from './components/GiftReveal';
import { PostComposer } from './components/PostComposer';
import { SocialDemo } from './components/SocialDemo';
import { Trophies } from './components/Trophies';
import { demoReducer, initialState } from './domain/reducer';
import { badgeUnlocked, derivedXp, micUnlocked, photoList, unlockedItemIds } from './domain/selectors';
import { ComposerInput, DemoData, DemoState, PromptId } from './domain/types';

type Screen = DemoState['currentScreen'];

const DOCK: { id: Screen; label: string; icon: string }[] = [
  { id: 'dorm', label: 'Dorm', icon: '🏠' },
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'trophies', label: 'Trophies', icon: '🏆' },
  { id: 'social', label: 'Feed', icon: '▤' },
];

export default function App() {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  const [screen, setScreen] = useState<Screen>('dorm');
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stateLoaded, setStateLoaded] = useState(false);
  const [stateError, setStateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const clientId = useRef<string | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const lastComposerInput = useRef<ComposerInput | null>(null);
  const postOperation = useRef(false);
  const [postBusy, setPostBusy] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState(false);
  const [composerVersion, setComposerVersion] = useState(0);
  const [replacement, setReplacement] = useState<{ text: string; input: ComposerInput } | null>(null);

  const handleComposerDraft = useCallback((draft: DemoState['composerDraft']) => {
    dispatch({ type: 'SET_COMPOSER_DRAFT', draft });
  }, []);
  const navigate = useCallback((next: Screen) => {
    setScreen(next);
    dispatch({ type: 'SET_CURRENT_SCREEN', screen: next });
  }, []);

  useEffect(() => {
    let alive = true;
    fetchDemo()
      .then(({ data }) => alive && setDemo(data))
      .catch((err: unknown) => alive && setLoadError(err instanceof Error ? err.message : 'Failed to load demo'));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setStateLoaded(false);
    setStateError(null);
    try {
      clientId.current = getBrowserClientId();
    } catch (err) {
      setStateError(err instanceof Error ? err.message : 'Could not identify this browser');
      return () => { alive = false; };
    }
    fetchDemoState(clientId.current)
      .then((saved) => {
        if (!alive) return;
        if (saved) {
          dispatch({ type: 'RESTORE_STATE', state: saved });
          setScreen(saved.currentScreen);
        }
        setStateLoaded(true);
      })
      .catch((err: unknown) => {
        if (alive) setStateError(err instanceof Error ? err.message : 'Could not load saved progress');
      });
    return () => { alive = false; };
  }, [loadAttempt]);

  useEffect(() => {
    if (!stateLoaded || !clientId.current || postOperation.current) return;
    const snapshot = state;
    setSaving(true);
    const timer = window.setTimeout(() => {
      if (postOperation.current) return;
      saveQueue.current = saveQueue.current
        .then(() => saveDemoState(clientId.current!, snapshot))
        .then(() => {
          setSaveError(null);
          setSaving(false);
        })
        .catch((err: unknown) => {
          setSaveError(err instanceof Error ? err.message : 'Could not save progress');
          setSaving(false);
        });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [state, stateLoaded]);

  const selectedEvent = demo?.events.find((e) => e.id === state.eventId) ?? null;

  if (loadError) {
    return (
      <div className="splash">
        <div className="splash-card">
          <p>⚠️ Could not load the demo content.</p>
          <p className="muted">{loadError}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload demo
          </button>
        </div>
      </div>
    );
  }

  if (stateError) {
    return (
      <div className="splash">
        <div className="splash-card">
          <p>⚠️ Could not load saved progress.</p>
          <p className="muted">{stateError}</p>
          <button className="btn btn-primary" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Retry database connection
          </button>
        </div>
      </div>
    );
  }

  if (!demo || !stateLoaded) {
    return (
      <div className="splash">
        <div className="splash-card">
          <div className="splash-logo" aria-hidden>🏆</div>
          <p>Loading LarpedIn…</p>
        </div>
      </div>
    );
  }

  const showDock = !['composer', 'gift'].includes(screen);

  const handleSelectEvent = (eventId: string) => {
    dispatch({ type: 'SELECT_EVENT', eventId });
    navigate('camera');
  };

  const handleCapture = (blob: Blob, promptId: PromptId) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        dispatch({ type: 'CAPTURE', dataUrl: reader.result, promptId });
      }
    };
    reader.readAsDataURL(blob);
  };

  const handleCompose = async (input: ComposerInput) => {
    try {
      return await compose(input);
    } catch (err) {
      // TypeError = network failure (backend absent) → run the in-browser
      // clone of POST /api/compose (same validation, same format).
      // Real API errors (e.g. 422) are surfaced, not masked.
      if (err instanceof TypeError && demo) {
        return localCompose(input, demo);
      }
      throw err;
    }
  };

  const handlePublish = async (text: string) => {
    if (postOperation.current || !clientId.current || !text.trim()) return;
    const input = replacement?.input ?? lastComposerInput.current ?? state.composerInput;
    if (!input) { setPostError('Open the composer to prepare your post.'); return; }
    postOperation.current = true;
    setPostBusy(true);
    setPostError(null);
    try {
      await saveQueue.current;
      const savedText = await saveUserPost(clientId.current, input);
      if (savedText !== text) throw new Error('The saved post did not match the draft.');
      dispatch({ type: 'SET_COMPOSER_INPUT', input });
      dispatch({ type: 'SET_POST_TEXT', text });
      dispatch({ type: 'PUBLISH_POST' });
      lastComposerInput.current = input;
      setReplacement(null);
      setEditingPost(false);
      if (state.eventId && !state.giftOpened) navigate('gift');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Could not save your post.');
    } finally {
      postOperation.current = false;
      setPostBusy(false);
    }
  };

  const handleDelete = async () => {
    if (postOperation.current || !clientId.current) return;
    postOperation.current = true;
    setPostBusy(true);
    setPostError(null);
    try {
      await saveQueue.current;
      await deleteUserPost(clientId.current);
      lastComposerInput.current = null;
      setReplacement(null);
      setEditingPost(false);
      setComposerVersion((version) => version + 1);
      dispatch({ type: 'DELETE_POST' });
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Could not delete your post.');
    } finally {
      postOperation.current = false;
      setPostBusy(false);
    }
  };

  const handleComposed = (text: string, input: ComposerInput) => {
    if (editingPost) {
      setReplacement({ text, input });
    } else {
      lastComposerInput.current = input;
      dispatch({ type: 'SET_COMPOSER_INPUT', input });
      dispatch({ type: 'SET_POST_TEXT', text });
    }
    navigate('social');
  };

  return (
    <div className="app">
      {saveError && (
        <div role="alert" className="persistence-error">
          Progress could not be saved to the database: {saveError}
        </div>
      )}
      {!saveError && saving && <div className="persistence-status">Saving progress…</div>}
      {screen === 'dorm' && (
        <Dorm
          xp={derivedXp(state)}
          standUpSubmitted={state.standUpSubmitted}
          standUpBullets={state.standUpBullets}
          standUpDraft={state.standUpDraft}
          onSubmitStandUp={(b1, b2) => dispatch({ type: 'SUBMIT_STAND_UP', bullet1: b1, bullet2: b2 })}
          onStandUpDraftChange={(draft) => dispatch({ type: 'SET_STAND_UP_DRAFT', draft })}
          onFindEvent={() => navigate('events')}
          avatarItem={state.avatarItem}
          roomItems={state.roomItems}
          onSelectAvatar={(itemId) => dispatch({ type: 'SET_AVATAR_ITEM', itemId })}
          onToggleRoomItem={(itemId) => dispatch({ type: 'TOGGLE_ROOM_ITEM', itemId })}
          unlockedItemIds={unlockedItemIds(state)}
          placements={state.placements}
          onPlaceItem={(itemId, spotId) => dispatch({ type: 'PLACE_ITEM', itemId, spotId })}
          onRemoveItem={(spotId) => dispatch({ type: 'REMOVE_ITEM', spotId })}
        />
      )}

      {screen === 'events' && (
        <Events
          events={demo.events}
          selectedEventId={state.eventId}
          onSelect={handleSelectEvent}
        />
      )}

      {screen === 'camera' &&
        (selectedEvent ? (
          <CameraGuide
            event={selectedEvent}
            completedPrompts={state.completedPrompts}
            photos={state.photos}
            onCapture={handleCapture}
            onCheck={(promptId) => dispatch({ type: 'CHECK_PROMPT', promptId })}
            onContinue={() => navigate('composer')}
          />
        ) : (
          <div className="empty-pick">
            <div className="empty-pick-icon" aria-hidden>📷</div>
            <h2>Event photo guide</h2>
            <p className="muted">
              Pick an event first — its photo guide (and your post) are built around it.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('events')}>
              Select an event
            </button>
          </div>
        ))}

      {selectedEvent && (
        <div className="page-with-header" style={{ display: screen === 'composer' ? undefined : 'none' }}>
          <header className="topbar">
            <button className="icon-btn" onClick={() => navigate('camera')} aria-label="Back to camera guide">
              ←
            </button>
            <span className="topbar-title">Post composer</span>
          </header>
          <PostComposer
            key={`${selectedEvent.id}-${composerVersion}`}
            event={selectedEvent}
            demo={demo}
            photos={photoList(state)}
            draft={state.composerDraft}
            onDraftChange={handleComposerDraft}
            onCompose={handleCompose}
            onComposed={handleComposed}
            onAiPreset={fetchAiPreset}
          />
        </div>
      )}

      {screen === 'gift' && (
        <GiftReveal
          onComplete={() => {
            // One-shot: mark the gift open and trigger the automatic
            // simulated recruiter message (idempotent reducer action).
            dispatch({ type: 'GIFT_ANIMATION_DONE' });
            navigate('social');
          }}
        />
      )}

      {screen === 'trophies' && (
        <Trophies
          badgeUnlocked={badgeUnlocked(state)}
          micUnlocked={micUnlocked(state)}
          lightsPlaced={state.roomItems.includes('rgb-lights')}
          standUpSubmitted={state.standUpSubmitted}
        />
      )}

      {screen === 'social' && (
        <div className="page-with-header">
          <header className="topbar">
            <button className="icon-btn" onClick={() => navigate('dorm')} aria-label="Back to dorm">
              ←
            </button>
            <span className="topbar-title">Simulated LinkedIn</span>
          </header>
          <SocialDemo
            profile={demo.profile}
            recruiter={demo.recruiter}
            postText={editingPost ? replacement?.text ?? '' : state.postText}
            photos={photoList(state)}
            outreachMessage={demo.outreachMessage}
            outreachSent={state.outreachSent}
            published={state.postPublished && !editingPost}
            onPublish={(text) => void handlePublish(text)}
            onEdit={selectedEvent ? () => navigate('composer') : undefined}
            onReplace={selectedEvent && state.postPublished ? () => { setEditingPost(true); setReplacement(null); navigate('composer'); } : undefined}
            onDelete={() => void handleDelete()}
            busy={postBusy}
            error={postError}
            replacing={editingPost}
            onCancelReplace={() => { setEditingPost(false); setReplacement(null); }}
          />
        </div>
      )}

      {showDock && (
        <nav className="dock" aria-label="Main">
          {DOCK.map((item) => (
            <button
              key={item.id}
              className={`dock-item${screen === item.id ? ' active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <span className="dock-icon" aria-hidden>{item.icon}</span>
              <span className="dock-label">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
