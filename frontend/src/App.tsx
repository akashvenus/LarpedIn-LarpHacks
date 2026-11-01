import { useEffect, useReducer, useState } from 'react';
import { compose, fetchDemo, localComposeText } from './api';
import { CameraGuide } from './components/CameraGuide';
import { Dorm } from './components/Dorm';
import { Events } from './components/Events';
import { GiftReveal } from './components/GiftReveal';
import { PostComposer } from './components/PostComposer';
import { SocialDemo } from './components/SocialDemo';
import { Trophies } from './components/Trophies';
import { demoReducer, initialState } from './domain/reducer';
import { badgeUnlocked, derivedXp, giftEligible, lightsUnlocked, micUnlocked } from './domain/selectors';
import { ComposerInput, DemoData, PromptId } from './domain/types';

type Screen = 'dorm' | 'events' | 'camera' | 'trophies' | 'composer' | 'gift' | 'social';

const DOCK: { id: Screen; label: string; icon: string }[] = [
  { id: 'dorm', label: 'Dorm', icon: '🏠' },
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'trophies', label: 'Trophies', icon: '🏆' },
];

export default function App() {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  const [screen, setScreen] = useState<Screen>('dorm');
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchDemo()
      .then(({ data }) => alive && setDemo(data))
      .catch((err: unknown) => alive && setLoadError(err instanceof Error ? err.message : 'Failed to load demo'));
    return () => {
      alive = false;
    };
  }, []);

  // Gift is driven by required task flags, not XP: once everything is done,
  // advance to the reveal exactly once (giftOpened gates repeats).
  useEffect(() => {
    if (demo && giftEligible(state) && !state.giftOpened) {
      setScreen('gift');
    }
  }, [demo, state]);

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

  const showDock = !['composer', 'gift', 'social'].includes(screen);

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
      // TypeError = network failure (backend absent). Show a real error
      // for API rejections (e.g. 422 invalid ids).
      if (err instanceof TypeError && demo && selectedEvent) {
        return localComposeText(input, demo.composer, selectedEvent.title);
      }
      throw err;
    }
  };

  const handlePublish = (text: string) => {
    dispatch({ type: 'SET_POST_TEXT', text });
    dispatch({ type: 'PUBLISH_POST' });
  };

  return (
    <div className="app">
      {screen === 'dorm' && (
        <Dorm
          xp={derivedXp(state)}
          micUnlocked={micUnlocked(state)}
          lightsUnlocked={lightsUnlocked(state)}
          standUpSubmitted={state.standUpSubmitted}
          onSubmitStandUp={() => dispatch({ type: 'SUBMIT_STAND_UP' })}
          onFindEvent={() => setScreen('events')}
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
            photoUrl={state.photoUrl}
            onCapture={handleCapture}
            onCheck={(promptId) => dispatch({ type: 'CHECK_PROMPT', promptId })}
            onContinue={() => setScreen('composer')}
          />
        ) : (
          <div className="empty-pick">
            <div className="empty-pick-icon" aria-hidden>📷</div>
            <h2>Camera is ready</h2>
            <p className="muted">Pick an event first to open its photo guide.</p>
            <button className="btn btn-primary" onClick={() => setScreen('events')}>
              Choose an event
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
            onPublish={handlePublish}
          />
        </div>
      )}

      {screen === 'gift' && <GiftReveal onComplete={() => setScreen('social')} />}

      {screen === 'trophies' && <Trophies badgeUnlocked={badgeUnlocked(state)} />}

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
            photoUrl={state.photoUrl}
            outreachMessage={demo.outreachMessage}
            outreachSent={state.outreachSent}
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
