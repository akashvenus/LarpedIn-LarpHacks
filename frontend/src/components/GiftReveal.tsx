import { useEffect, useRef, useState } from 'react';
import { ASSETS } from '../assets/manifest';

export interface GiftRevealProps {
  /** Fired exactly once, after the open animation finishes. */
  onComplete: () => void;
}

/**
 * Gift reveal (F3): automatically animates closed → open and advances.
 * No clicks required. The prize: a profile-photo icon and a message
 * icon — "Free recruiter message" — delivered in the simulated social
 * app. onComplete is guarded so it fires exactly once.
 */
export function GiftReveal({ onComplete }: GiftRevealProps) {
  const [opened, setOpened] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const openTimer = window.setTimeout(() => setOpened(true), 900);
    const doneTimer = window.setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
    }, 2600);
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div className="gift-screen">
      <div className={`gift-box${opened ? ' open' : ''}`}>
        <img
          src={opened ? ASSETS.giftOpen : ASSETS.giftClosed}
          alt={opened ? 'Open gift box' : 'Closed gift box'}
        />
        {opened && <div className="gift-glow" aria-hidden />}
      </div>

      <div className={`gift-copy${opened ? ' show' : ''}`}>
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
