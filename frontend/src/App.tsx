import { useEffect, useReducer, useRef, useState } from 'react';
import { compose, fetchAiPreset, fetchDemo, localCompose, savePost } from './api';
import { CameraGuide } from './components/CameraGuide';
import { Dorm } from './components/Dorm';
import { Events } from './components/Events';
import { GiftReveal } from './components/GiftReveal';
import { PostComposer } from './components/PostComposer';
import { SocialDemo } from './components/SocialDemo';
import { Trophies } from './components/Trophies';
import { demoReducer, initialState } from './domain/reducer';
import { badgeUnlocked, derivedXp, micUnlocked, photoList } from './domain/selectors';
import { ComposerInput, DemoData, PromptId } from './domain/types';

type Screen = 'dorm' | 'events' | 'camera' | 'trophies' | 'composer' | 'gift' | 'social';

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
  const lastComposerInput = useRef<ComposerInput | null>(null);
  const publishedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    fetchDemo()
      .then(({ data }) => alive && setDemo(data))
      .catch((err: unknown) => alive && setLoadError(err instanceof Error ? err.message : 'Failed to load demo'));
    return () => {
      alive = false;
    };
  }, []);

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

  if (!demo) {
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
    setScreen('camera');
  };

  const handleCapture = (blob: Blob, promptId: PromptId) => {
    dispatch({ type: 'CAPTURE', blob, promptId });
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

  const handlePublish = (text: string) => {
    if (publishedRef.current) return;
    publishedRef.current = true;
    dispatch({ type: 'SET_POST_TEXT', text });
    dispatch({ type: 'PUBLISH_POST' });
    if (state.eventId && !state.giftOpened) setScreen('gift');
    const input = lastComposerInput.current;
    if (input) {
      void savePost(input).catch(() => {});
    }
  };

  const handleComposed = (text: string, input: ComposerInput) => {
    lastComposerInput.current = input;
    dispatch({ type: 'SET_POST_TEXT', text });
    // The LinkedIn mockup is now the publish surface (draft + Post button).
    setScreen('social');
  };

  return (
    <div className="app">
      {screen === 'dorm' && (
        <Dorm
          xp={derivedXp(state)}
          standUpSubmitted={state.standUpSubmitted}
          standUpBullets={state.standUpBullets}
          onSubmitStandUp={(b1, b2) => dispatch({ type: 'SUBMIT_STAND_UP', bullet1: b1, bullet2: b2 })}
          onFindEvent={() => setScreen('events')}
          avatarItem={state.avatarItem}
          roomItems={state.roomItems}
          onSelectAvatar={(itemId) => dispatch({ type: 'SET_AVATAR_ITEM', itemId })}
          onToggleRoomItem={(itemId) => dispatch({ type: 'TOGGLE_ROOM_ITEM', itemId })}
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
            onContinue={() => setScreen('composer')}
          />
        ) : (
          <div className="empty-pick">
            <div className="empty-pick-icon" aria-hidden>📷</div>
            <h2>Event photo guide</h2>
            <p className="muted">
              Pick an event first — its photo guide (and your post) are built around it.
            </p>
            <button className="btn btn-primary" onClick={() => setScreen('events')}>
              Select an event
            </button>
          </div>
        ))}

      {screen === 'composer' && selectedEvent && (
        <div className="page-with-header">
          <header className="topbar">
            <button className="icon-btn" onClick={() => setScreen('camera')} aria-label="Back to camera guide">
              ←
            </button>
            <span className="topbar-title">Post composer</span>
          </header>
          <PostComposer
            event={selectedEvent}
            options={demo.composer}
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
            setScreen('social');
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
            <button className="icon-btn" onClick={() => setScreen('dorm')} aria-label="Back to dorm">
              ←
            </button>
            <span className="topbar-title">Simulated LinkedIn</span>
          </header>
          <SocialDemo
            profile={demo.profile}
            recruiter={demo.recruiter}
            postText={state.postText}
            photos={photoList(state)}
            outreachMessage={demo.outreachMessage}
            outreachSent={state.outreachSent}
            published={state.postPublished}
            onPublish={handlePublish}
          />
        </div>
      )}

      {showDock && (
        <nav className="dock" aria-label="Main">
          {DOCK.map((item) => (
            <button
              key={item.id}
              className={`dock-item${screen === item.id ? ' active' : ''}`}
              onClick={() => setScreen(item.id)}
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
