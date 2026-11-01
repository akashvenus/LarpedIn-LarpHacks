import { useEffect, useRef, useState } from 'react';
import { ASSETS } from '../assets/manifest';

export interface GiftRevealProps {
  /** Fired exactly once, after the animation sequence finishes. */
  onComplete: () => void;
}

/**
 * Gift reveal (F3): the closed gift box image is split into two CSS
 * layers (lid = top 42%, body = bottom 58%) and animated: the lid comes
 * off, then the box fades out. See the marked block in social.css —
 * Spencer tunes the keyframes there (ChatGPT-assisted) without touching
 * this component. onComplete is guarded to fire exactly once.
 */
export function GiftReveal({ onComplete }: GiftRevealProps) {
  const [running, setRunning] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    // Start the CSS animation on the next frame after mount.
    const runTimer = window.setTimeout(() => setRunning(true), 60);
    const copyTimer = window.setTimeout(() => setShowCopy(true), 2300);
    const doneTimer = window.setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
    }, 4300);
    return () => {
      window.clearTimeout(runTimer);
      window.clearTimeout(copyTimer);
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

      <div className={`gift-copy${showCopy ? ' show' : ''}`}>
        <h1>You earned a prize</h1>
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
          A profile-photo post plus one prewritten outreach message, auto-sent to a fictional
          recruiter inside the demo simulation.
        </p>
        <p className="gift-advance">Opening your simulated inbox…</p>
      </div>
    </div>
  );
}
