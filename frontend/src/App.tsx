import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  compose,
  fetchAiPreset,
  fetchCommunityPosts,
  fetchDemo,
  fetchDemoState,
  getBrowserClientId,
  localCompose,
  saveDemoState,
  saveBrowserPost,
  deleteUserPost,
  fetchStandUps, publishStandUp, deleteStandUp,
} from './api';
import { CameraGuide } from './components/CameraGuide';
import { Dorm } from './components/Dorm';
import { Events } from './components/Events';
import { GiftReveal } from './components/GiftReveal';
import { PostComposer } from './components/PostComposer';
import { Onboarding } from './components/Onboarding';
import { Inbox } from './components/Inbox';
import { SocialDemo } from './components/SocialDemo';
import { Trophies } from './components/Trophies';
import { demoReducer, initialState } from './domain/reducer';
import { badgeUnlocked, derivedXp, micUnlocked, nextJourneyStep, photoList, unlockedItemIds } from './domain/selectors';
import { CommunityPost, ComposerInput, DemoData, DemoState, PromptId, StandUpPost } from './domain/types';
import { hasStandUpToday, localDay } from './domain/standUp';
import { MOCK_DEMO } from './demo/mockDemo';
import { loadLocalDemo, saveLocalDemo } from './demo/localDemo';

const LOCAL_STAND_UPS_KEY = 'larpedin-local-stand-ups';

const isLocalDemo = /^\/demo\/?$/.test(window.location.pathname);

type Screen = DemoState['currentScreen'];

function FeedIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </svg>
  );
}

const DOCK: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'dorm', label: 'Dorm', icon: '🏠' },
  { id: 'trophies', label: 'Trophies', icon: '🏆' },
  { id: 'social', label: 'Feed', icon: <FeedIcon /> },
];

export default function App() {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  const [screen, setScreen] = useState<Screen>('dorm');
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stateLoaded, setStateLoaded] = useState(false);
  const [stateError, setStateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [standUps, setStandUps] = useState<StandUpPost[]>([]);
  const [standUpsReady, setStandUpsReady] = useState(false);
  const [standUpError, setStandUpError] = useState<string | null>(null);
  const [standUpBusy, setStandUpBusy] = useState(false);
  const [today, setToday] = useState(() => localDay());
  const standUpOperation = useRef(false);
  const [saving, setSaving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const clientId = useRef<string | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const lastComposerInput = useRef<ComposerInput | null>(null);
  const postOperation = useRef(false);
  const [postBusy, setPostBusy] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState(false);
  const [sendingRecruiter, setSendingRecruiter] = useState(false);
  const [recruiterReplyReady, setRecruiterReplyReady] = useState(false);
  const [composerVersion, setComposerVersion] = useState(0);
  const [xpPulse, setXpPulse] = useState(0);
  const previousXp = useRef(0);
  const xp = derivedXp(state);
  const [replacement, setReplacement] = useState<{ text: string; input: ComposerInput } | null>(null);

  const handleComposerDraft = useCallback((draft: DemoState['composerDraft']) => {
    dispatch({ type: 'SET_COMPOSER_DRAFT', draft });
  }, []);
  const navigate = useCallback((next: Screen) => {
    setScreen(next);
    dispatch({ type: 'SET_CURRENT_SCREEN', screen: next });
  }, []);

  const refreshStandUps = useCallback(async () => {
    try {
      const posts = isLocalDemo
        ? JSON.parse(window.localStorage.getItem(LOCAL_STAND_UPS_KEY) || '[]') as StandUpPost[]
        : await fetchStandUps(clientId.current!);
      setStandUps(posts);
      setStandUpsReady(true);
      setStandUpError(null);
    } catch {
      setStandUpsReady(false);
      setStandUpError('Could not load Stand-Ups. Try again.');
    }
  }, []);

  useEffect(() => {
    if (stateLoaded && (isLocalDemo || clientId.current)) void refreshStandUps();
  }, [stateLoaded, refreshStandUps]);

  useEffect(() => {
    if (stateLoaded && screen === 'social' && (isLocalDemo || clientId.current)) void refreshStandUps();
  }, [stateLoaded, screen, refreshStandUps]);

  useEffect(() => {
    if (!stateLoaded || !standUpsReady || state.standUpSubmitted) return;
    const ownPost = standUps.find((post) => post.isOwn);
    if (ownPost) dispatch({ type: 'SUBMIT_STAND_UP', bullet1: ownPost.win, bullet2: ownPost.nextStep });
  }, [stateLoaded, standUpsReady, standUps, state.standUpSubmitted]);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(localDay()), 30000);
    const update = () => setToday(localDay());
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);

  useEffect(() => {
    if (xp > previousXp.current) setXpPulse((pulse) => pulse + 1);
    previousXp.current = xp;
  }, [xp]);

  useEffect(() => {
    let alive = true;
    if (isLocalDemo) {
      setDemo(MOCK_DEMO);
      return () => { alive = false; };
    }
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
    if (isLocalDemo) {
      try {
        const saved = loadLocalDemo(window.localStorage);
        if (saved) {
          dispatch({ type: 'RESTORE_STATE', state: saved });
          setScreen(saved.currentScreen);
        }
      } catch {
        // Browsers can block localStorage; the demo still works for this session.
      }
      setStateLoaded(true);
      return () => { alive = false; };
    }
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
    if (!stateLoaded || postOperation.current) return;
    if (isLocalDemo) {
      try {
        saveLocalDemo(window.localStorage, state);
        setSaveError(null);
      } catch {
        setSaveError('Browser storage is unavailable or full; progress will last for this session only.');
      }
      return;
    }
    if (!clientId.current) return;
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

  useEffect(() => {
    if (!sendingRecruiter) return;
    const timer = window.setTimeout(() => setSendingRecruiter(false), 1200);
    return () => window.clearTimeout(timer);
  }, [sendingRecruiter]);
  useEffect(() => {
    if (!stateLoaded || !state.outreachSent || state.recruiterReplyOutcome) return;
    dispatch({ type: 'SCHEDULE_RECRUITER_REPLY', outcome: Math.random() < 0.5 ? 'offer' : 'rejection', replyAt: Date.now() + 3000 });
  }, [stateLoaded, state.outreachSent, state.recruiterReplyOutcome]);
  useEffect(() => {
    if (!state.outreachSent || !state.recruiterReplyOutcome || state.recruiterReplyAt === null) {
      setRecruiterReplyReady(false);
      return;
    }
    const delay = Math.max(0, state.recruiterReplyAt - Date.now());
    setRecruiterReplyReady(delay === 0);
    if (delay === 0) return;
    const timer = window.setTimeout(() => setRecruiterReplyReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [state.outreachSent, state.recruiterReplyOutcome, state.recruiterReplyAt]);
  useEffect(() => {
    if (isLocalDemo || screen !== 'social') return;
    let alive = true;
    fetchCommunityPosts(clientId.current ?? undefined)
      .then((posts) => {
        if (!alive) return;
        setCommunityPosts(posts);
        setFeedError(null);
      })
      .catch((err: unknown) => alive && setFeedError(err instanceof Error ? err.message : 'Could not load community feed'));
    return () => { alive = false; };
  }, [screen]);

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
          <a className="btn" href="/demo">Open local demo</a>
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

  if (!state.name?.trim() || !state.occupation?.trim()) {
    return <Onboarding onComplete={(name, occupation) => dispatch({ type: 'SET_PROFILE', name, occupation })} />;
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
    if (isLocalDemo) return localCompose(input, demo);
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
    if (postOperation.current || (!isLocalDemo && !clientId.current) || !text.trim()) return;
    const input = replacement?.input ?? lastComposerInput.current ?? state.composerInput;
    if (!input) { setPostError('Open the composer to prepare your post.'); return; }
    postOperation.current = true;
    setPostBusy(true);
    setPostError(null);
    try {
      await saveQueue.current;
      const savedText = isLocalDemo ? localCompose(input, demo) : await saveBrowserPost(clientId.current!, input, photoList(state));
      if (savedText !== text) throw new Error('The saved post did not match the draft.');
      if (!isLocalDemo) {
        fetchCommunityPosts(clientId.current ?? undefined)
          .then(setCommunityPosts)
          .catch((err: unknown) => setFeedError(err instanceof Error ? err.message : 'Could not load community feed'));
      }
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
    if (postOperation.current || (!isLocalDemo && !clientId.current)) return;
    postOperation.current = true;
    setPostBusy(true);
    setPostError(null);
    try {
      await saveQueue.current;
      if (!isLocalDemo) {
        await deleteUserPost(clientId.current!);
        fetchCommunityPosts(clientId.current ?? undefined)
          .then(setCommunityPosts)
          .catch((err: unknown) => setFeedError(err instanceof Error ? err.message : 'Could not load community feed'));
      }
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

  const handleStandUp = async (win: string, nextStep: string) => {
    if (standUpOperation.current || postOperation.current || !standUpsReady || hasStandUpToday(standUps) || !(win.trim() || nextStep.trim())) return;
    standUpOperation.current = true;
    postOperation.current = true;
    setStandUpBusy(true);
    setStandUpError(null);
    try {
      const input = { localDate: localDay(), name: state.name, headline: state.occupation, win, nextStep };
      let post: StandUpPost;
      if (isLocalDemo) {
        post = { ...input, id: Date.now(), createdAt: new Date().toISOString(), isOwn: true };
        window.localStorage.setItem(LOCAL_STAND_UPS_KEY, JSON.stringify([post, ...standUps]));
      } else {
        await saveQueue.current;
        post = await publishStandUp(clientId.current!, input);
      }
      setStandUps((posts) => [post, ...posts]);
      dispatch({ type: 'SUBMIT_STAND_UP', bullet1: win, bullet2: nextStep });
      dispatch({ type: 'SET_STAND_UP_DRAFT', draft: '' });
      setToday(localDay());
    } catch (err) {
      if (err instanceof Error && err.message.includes('already posted')) await refreshStandUps();
      setStandUpError(err instanceof Error ? err.message : 'Could not post your Stand-Up. Try again.');
    } finally {
      standUpOperation.current = false;
      postOperation.current = false;
      setStandUpBusy(false);
    }
  };

  const handleDeleteStandUp = async (post: StandUpPost) => {
    if (standUpOperation.current || !post.isOwn) return;
    standUpOperation.current = true;
    setStandUpBusy(true);
    setStandUpError(null);
    try {
      if (isLocalDemo) window.localStorage.setItem(LOCAL_STAND_UPS_KEY, JSON.stringify(standUps.filter((item) => item.id !== post.id)));
      else await deleteStandUp(clientId.current!, post.id);
      setStandUps((posts) => posts.filter((item) => item.id !== post.id));
    } catch (err) {
      setStandUpError(err instanceof Error ? err.message : 'Could not delete your Stand-Up.');
    } finally {
      standUpOperation.current = false;
      setStandUpBusy(false);
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
    <div className={`app${screen === 'social' || screen === 'inbox' ? ' social-page' : ''}`}>
      {saveError && (
        <div role="alert" className="persistence-error">
          {isLocalDemo ? saveError : `Progress could not be saved to the database: ${saveError}`}
        </div>
      )}
      {!saveError && saving && <div className="persistence-status" role="status" aria-label="Saving progress"><span aria-hidden="true" /></div>}
      {screen === 'dorm' && (
        <Dorm
          xp={xp}
          xpPulse={xpPulse}
          journeyStep={nextJourneyStep(state, standUpsReady, standUps.some((post) => post.isOwn && post.localDate === today))}
          onJourneyNavigate={(next) => navigate(next)}
          standUpSubmitted={state.standUpSubmitted}
          standUpToday={standUps.some((post) => post.isOwn && post.localDate === today)}
          standUpBusy={standUpBusy}
          standUpError={standUpError}
          standUpReady={standUpsReady}
          onRetryStandUps={() => void refreshStandUps()}
          standUpDraft={state.standUpDraft}
          onSubmitStandUp={(b1, b2) => void handleStandUp(b1, b2)}
          onStandUpDraftChange={(draft) => dispatch({ type: 'SET_STAND_UP_DRAFT', draft })}
          avatarItem={state.avatarItem}
          accessory={state.accessory}
          heldProp={state.heldProp}
          onSelectAccessory={(itemId) => dispatch({ type: 'SET_ACCESSORY', itemId })}
          onSelectHeldProp={(itemId) => dispatch({ type: 'SET_HELD_PROP', itemId })}
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
              <ArrowLeft size={20} className="nav-arrow" aria-hidden="true" />
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
            onAiPreset={isLocalDemo ? async () => { throw new Error('Local demo'); } : fetchAiPreset}
          />
        </div>
      )}

      {screen === 'gift' && (
        <GiftReveal
          recruiter={demo.recruiter}
          onComplete={() => {
            // Claiming the gift sends the message inside the demo.
            dispatch({ type: 'GIFT_ANIMATION_DONE', outcome: Math.random() < 0.5 ? 'offer' : 'rejection', replyAt: Date.now() + 4500 });
            setSendingRecruiter(true);
            navigate('inbox');
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

      {(screen === 'social' || screen === 'inbox') && (
        <div className="page-with-header">
          <header className="topbar">
            <button className="icon-btn" onClick={() => navigate('dorm')} aria-label="Back to dorm">
              <ArrowLeft size={20} className="nav-arrow" aria-hidden="true" />
            </button>
            <span className="brand-logo social-wordmark" aria-label="LarpedIn">Larped<span>in</span></span>
            {screen === 'inbox' && <span className="social-section">Inbox</span>}
            <button type="button" className="icon-btn social-mail" aria-label={screen === 'inbox' ? 'Back to feed' : 'Open inbox'} onClick={() => navigate(screen === 'inbox' ? 'social' : 'inbox')}>
              {screen === 'inbox' ? <FeedIcon /> : '✉️'}
            </button>
          </header>
          {screen === 'inbox' ? <Inbox recruiter={demo.recruiter} message={demo.outreachMessage} sent={state.outreachSent} sending={sendingRecruiter} reply={recruiterReplyReady ? state.recruiterReplyOutcome : null} userAvatar={state.photos[state.profilePhoto ?? 'selfie'] ?? state.photos.selfie ?? photoList(state)[0]?.url} /> : <SocialDemo
            profile={{ ...demo.profile, name: state.name, headline: state.occupation }}
            postText={editingPost ? replacement?.text ?? '' : state.postText}
            photos={photoList(state)}
            published={state.postPublished && !editingPost}
            profilePhoto={state.profilePhoto}
            onSelectPhoto={(promptId) => dispatch({ type: 'SET_PROFILE_PHOTO', promptId })}
            onPublish={(text) => void handlePublish(text)}
            onEdit={selectedEvent ? () => navigate('composer') : undefined}
            onReplace={selectedEvent && state.postPublished ? () => { setEditingPost(true); setReplacement(null); navigate('composer'); } : undefined}
            onDelete={() => void handleDelete()}
            busy={postBusy}
            error={postError}
            replacing={editingPost}
            onCancelReplace={() => { setEditingPost(false); setReplacement(null); }}
            communityPosts={communityPosts}
            standUps={standUps}
            standUpBusy={standUpBusy}
            standUpError={standUpError}
            onDeleteStandUp={(post) => void handleDeleteStandUp(post)}
            feedError={feedError}
          />}
        </div>
      )}

      {showDock && (
        <nav className="dock" aria-label="Main">
          {DOCK.map((item) => (
            <button
              key={item.id}
              className={`dock-item${item.id === 'dorm' ? ' dock-home' : ''}${screen === item.id ? ' active' : ''}`}
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
