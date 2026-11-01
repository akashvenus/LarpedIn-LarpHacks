import { useEffect, useState } from 'react';
import { ASSETS } from '../assets/manifest';

export interface SocialDemoProps {
  profile: { id: string; name: string; headline: string };
  recruiter: { id: string; name: string; headline: string };
  postText: string;
  photoUrl: string | null;
  outreachMessage: string;
  outreachSent: boolean;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Simulated social app (F3): visibly labeled demo simulation with a
 * seeded profile, a feed showing the published post + captured photo,
 * and an inbox where the prewritten recruiter message appears
 * automatically when outreachSent flips true — no send button.
 */
export function SocialDemo({
  profile,
  recruiter,
  postText,
  photoUrl,
  outreachMessage,
  outreachSent,
}: SocialDemoProps) {
  const [messageShown, setMessageShown] = useState(false);

  // One-shot entrance animation when the automatic send lands.
  useEffect(() => {
    if (!outreachSent) return;
    const t = window.setTimeout(() => setMessageShown(true), 700);
    return () => window.clearTimeout(t);
  }, [outreachSent]);

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
          {photoUrl && (
            <img className="feed-photo" src={photoUrl} alt="Your captured event photo" />
          )}
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
    </div>
  );
}
