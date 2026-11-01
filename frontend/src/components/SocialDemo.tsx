import { useEffect, useState } from 'react';
import { ASSETS } from '../assets/manifest';
import { PhotoRef, PROMPTS, PromptId } from '../domain/types';

export interface SocialDemoProps {
  profile: { id: string; name: string; headline: string };
  recruiter: { id: string; name: string; headline: string };
  postText: string;
  /** Captured photos in fixed prompt order (room → selfie → banner → handshake). */
  photos: PhotoRef[];
  outreachMessage: string;
  outreachSent: boolean;
  /** Draft phase (unpublished): show the post preview + Post button.
   *  Live phase (published): feed post + automatic inbox message. */
  published: boolean;
  onPublish: (text: string) => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function photoAlt(promptId: PromptId): string {
  return PROMPTS.find((p) => p.id === promptId)?.label ?? 'Event';
}

/**
 * Simulated social app (F3). Visibly labeled demo simulation with a
 * seeded profile. Before publishing it doubles as the publish surface:
 * the composed post + all captured photos appear as a draft with a
 * single Post button (no editable field — mockup demo). After
 * publishing, the feed shows the post and the prewritten recruiter
 * message arrives automatically when outreachSent flips true.
 */
export function SocialDemo({
  profile,
  recruiter,
  postText,
  photos,
  outreachMessage,
  outreachSent,
  published,
  onPublish,
}: SocialDemoProps) {
  const [messageShown, setMessageShown] = useState(false);

  // One-shot entrance animation when the automatic send lands.
  useEffect(() => {
    if (!published || !outreachSent) return;
    const t = window.setTimeout(() => setMessageShown(true), 700);
    return () => window.clearTimeout(t);
  }, [published, outreachSent]);

  const photoGrid =
    photos.length > 0 ? (
      <div className="photo-grid">
        {photos.map((ph) => (
          <img key={ph.promptId} src={ph.url} alt={`${photoAlt(ph.promptId)} — captured at the event`} />
        ))}
      </div>
    ) : null;

  return (
    <div className="social">
      <div className="social-label">
        <span className="pill pill-sim">Demo simulation</span>
        <span className="muted">In-app only — no real account, no real messages.</span>
      </div>

      <section className="card profile-card">
        <img className="profile-avatar" src={ASSETS.avatar} alt="" />
        <div>
          <h2 style={{ margin: 0 }}>{profile.name}</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>{profile.headline}</p>
        </div>
      </section>

      {!published ? (
        <section className="card">
          <h3>Your post · draft</h3>
          <article className="feed-post">
            <div className="feed-head">
              <img className="feed-avatar" src={ASSETS.avatar} alt="" />
              <div>
                <strong>{profile.name}</strong>
                <div className="muted feed-time">{profile.headline} · draft</div>
              </div>
            </div>
            {postText ? (
              <p className="feed-text">{postText}</p>
            ) : (
              <p className="muted">Composing your post…</p>
            )}
            {photoGrid}
          </article>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 12 }}
            disabled={!postText.trim()}
            onClick={() => onPublish(postText)}
          >
            📤 Post to feed · +40 XP
          </button>
        </section>
      ) : (
        <>
          <section className="card">
            <h3>Feed</h3>
            <article className="feed-post">
              <div className="feed-head">
                <img className="feed-avatar" src={ASSETS.avatar} alt="" />
                <div>
                  <strong>{profile.name}</strong>
                  <div className="muted feed-time">{profile.headline} · Just now</div>
                </div>
              </div>
              <p className="feed-text">{postText}</p>
              {photoGrid}
              <div className="feed-fake-actions" aria-hidden>
                <span>👍 12</span>
                <span>💬 3</span>
                <span>↗ 1 repost</span>
              </div>
            </article>
          </section>

          <section className="card">
            <h3>Inbox {outreachSent && <span className="inbox-count">1</span>}</h3>
            {messageShown ? (
              <article className="inbox-msg">
                <div className="inbox-head">
                  <div className="inbox-avatar" aria-hidden>{initials(recruiter.name)}</div>
                  <div>
                    <strong>{recruiter.name}</strong>
                    <div className="muted feed-time">{recruiter.headline}</div>
                  </div>
                </div>
                <div className="inbox-bubble">{outreachMessage}</div>
                <div className="inbox-status">✅ Delivered automatically · just now</div>
              </article>
            ) : (
              <p className="muted inbox-waiting">
                {outreachSent ? 'Sending message…' : 'Waiting for the demo to send your message…'}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
