import { useEffect, useRef, useState } from 'react';
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
 * After the signal: a sealed "Free recruiter message post" card appears
 * and opens (title kept: "Free recruiter message"), then auto-advance.
 */
export function GiftReveal({ onComplete }: GiftRevealProps) {
  const [done, setDone] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const firedRef = useRef(false);

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
    const doneTimer = window.setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
    }, 2500);
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(doneTimer);
    };
  }, [done, onComplete]);

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
              One profile-photo post plus a prewritten outreach message, automatically sent to a
              fictional recruiter inside the demo simulation.
            </p>
          </article>
        </div>
      )}

      <p className={`gift-advance${postOpen ? ' show' : ''}`}>Opening your simulated inbox…</p>
    </div>
  );
}
