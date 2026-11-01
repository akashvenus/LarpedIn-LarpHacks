import { useEffect, useRef, useState } from 'react';
import { ASSETS } from '../assets/manifest';

export interface GiftRevealProps {
  /** Fired exactly once, after the animation sequence finishes. */
  onComplete: () => void;
}

/**
 * Gift reveal (F3):
 *   1. Closed gift image (split into lid/body CSS layers) wiggles, the
 *      lid comes off, the box fades.
 *   2. A sealed "Free recruiter message post" card appears, then opens
 *      to reveal the prize (title kept: "Free recruiter message").
 *   3. Auto-advances. All timing lives in social.css (TUNABLE BLOCK)
 *      and the timers below.
 */
export function GiftReveal({ onComplete }: GiftRevealProps) {
  const [running, setRunning] = useState(false);
  const [postVisible, setPostVisible] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const runTimer = window.setTimeout(() => setRunning(true), 60);
    const postTimer = window.setTimeout(() => setPostVisible(true), 2500);
    const openTimer = window.setTimeout(() => setPostOpen(true), 3200);
    const doneTimer = window.setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
    }, 5400);
    return () => {
      window.clearTimeout(runTimer);
      window.clearTimeout(postTimer);
      window.clearTimeout(openTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const bg = { backgroundImage: `url(${ASSETS.giftClosed})` };

  return (
    <div className="gift-screen">
      <div className={`gift-stage${running ? ' run' : ''}`} role="img" aria-label="Animated gift box opening">
        <div className="gift-part gift-body" style={bg} />
        <div className="gift-part gift-lid" style={bg} />
      </div>

      {postVisible && (
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
