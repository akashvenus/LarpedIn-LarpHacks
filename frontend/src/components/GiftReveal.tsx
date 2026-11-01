import { useEffect, useState } from 'react';

export interface GiftRevealProps {
  recruiter: { name: string; headline: string };
  onComplete: () => void;
}

export function GiftReveal({ recruiter, onComplete }: GiftRevealProps) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message === 'gift-done' || (message && typeof message === 'object' && message.type === 'gift-done')) setDone(true);
    };
    window.addEventListener('message', onMessage);
    const fallback = window.setTimeout(() => setDone(true), 6500);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div className="gift-screen">
      <section className={`card gift-card${done ? ' is-revealed' : ''}`} aria-label="Gift reveal">
        <div className="gift-visual">
          <iframe className="gift-iframe" src="assets/gift-animation.html" title="Gift animation" scrolling="no" aria-hidden={done} />
          <div className="gift-reward" aria-hidden={!done}>
            <div className="prize-icon" aria-hidden="true">💬</div>
            <h2>Free recruiter message</h2>
            <p>A message for <strong>{recruiter.name}</strong> is ready to go.</p>
            <p className="muted">{recruiter.headline}</p>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-block gift-claim" onClick={onComplete} disabled={!done}>Claim gift</button>
      </section>
    </div>
  );
}
