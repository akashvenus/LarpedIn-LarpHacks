import { useEffect, useState } from 'react';
import { ASSETS } from '../assets/manifest';

export interface GiftRevealProps {
  /** Fired exactly once, after the animation + prize card sequence finishes. */
  onComplete: () => void;
}

/**
 * Gift reveal (F3): the drop-in animation lives in
 * public/assets/gift-animation.html (Spencer's, self-contained) and runs
 * in an iframe. It signals completion with postMessage({type:'gift-done'});
 * a 6.5s fallback timer guarantees the demo never strands, even if the
 * file or the signal is missing.
 *
 * After the signal, the prize card opens and the user claims it to continue.
 */
export function GiftReveal({ onComplete }: GiftRevealProps) {
  const [done, setDone] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  // Listen for the animation's completion signal + safety fallback.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const m = e.data;
      if (m === 'gift-done' || (m && typeof m === 'object' && m.type === 'gift-done')) {
        setDone(true);
      }
    };
    window.addEventListener('message', onMessage);
    const fallback = window.setTimeout(() => setDone(true), 6500);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(fallback);
    };
  }, []);

  // Prize card sequence, once the animation is done.
  useEffect(() => {
    if (!done) return;
    const openTimer = window.setTimeout(() => setPostOpen(true), 700);
    return () => window.clearTimeout(openTimer);
  }, [done]);

  return (
    <div className="gift-screen">
      <iframe
        className="gift-iframe"
        src="assets/gift-animation.html"
        title="Gift animation"
        scrolling="no"
      />

      {done && (
        <div className={`gift-post-wrap${postOpen ? ' open' : ''}`}>
          <div className="gift-post-sealed">
            <span aria-hidden>🔏</span>
            <strong>Free recruiter message post</strong>
            <span aria-hidden>🔏</span>
          </div>
          <article className="gift-post-open">
            <div className="feed-head">
              <img className="feed-avatar" src={ASSETS.avatar} alt="" />
              <div>
                <strong>You</strong>
                <div className="muted feed-time">Just now · simulated post</div>
              </div>
            </div>
            <div className="prize-row">
              <div className="prize-icon" aria-hidden>
                <span role="img" aria-label="Profile photo icon">📷</span>
              </div>
              <div className="prize-icon" aria-hidden>
                <span role="img" aria-label="Message icon">💬</span>
              </div>
            </div>
            <h2>Free recruiter message</h2>
            <p className="muted">
              Claim this gift to send your post and a prewritten message to a fictional recruiter
              inside the demo simulation.
            </p>
          </article>
        </div>
      )}

      {postOpen && <button type="button" className="btn btn-primary" onClick={onComplete}>Claim gift</button>}
    </div>
  );
}
