import { useState } from 'react';
import { ASSETS } from '../assets/manifest';

export interface DormProps {
  xp: number;
  micUnlocked: boolean;
  lightsUnlocked: boolean;
  standUpSubmitted: boolean;
  onSubmitStandUp: () => void;
  onFindEvent: () => void;
}

/**
 * Dorm screen (F1): backdrop, avatar, internship XP bar, unlockable
 * cosmetics in fixed slots, event CTA, and the optional two-bullet
 * stand-up (+5 XP, can never unlock the gift on its own).
 */
export function Dorm({
  xp,
  micUnlocked,
  lightsUnlocked,
  standUpSubmitted,
  onSubmitStandUp,
  onFindEvent,
}: DormProps) {
  const [bullet1, setBullet1] = useState('');
  const [bullet2, setBullet2] = useState('');

  return (
    <>
      <header>
        <h1>LarpedIn</h1>
        <p className="muted" style={{ margin: '0 0 12px' }}>
          Your internship sim. Photo ops → post → prize.
        </p>
        <div className="card xp-wrap">
          <div className="xp-row">
            <span>Internship progress</span>
            <strong>{xp}/100 XP</strong>
          </div>
          <div
            className="xp-bar"
            role="progressbar"
            aria-valuenow={xp}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Internship progress"
          >
            <div className="xp-fill" style={{ width: `${xp}%` }} />
          </div>
        </div>
      </header>

      <div className="dorm-scene" aria-label="Your dorm room">
        <img className="dorm-bg" src={ASSETS.dormBackground} alt="" />
        {lightsUnlocked && (
          <div className="dorm-slot slot-lights">
            <img className="item" src={ASSETS.rgbLights} alt="RGB lights, unlocked" />
          </div>
        )}
        <div className="dorm-slot slot-avatar">
          <img className="item" src={ASSETS.avatar} alt="You, in the dorm" />
        </div>
        {micUnlocked && (
          <div className="dorm-slot slot-mic">
            <img className="item" src={ASSETS.mic} alt="Holdable microphone, unlocked" />
          </div>
        )}
      </div>

      <div className="dorm-cta-row">
        <button className="btn btn-primary" onClick={onFindEvent}>
          📅 Find an event
        </button>
      </div>

      <section className="card">
        <h3>Daily stand-up · +5 XP (optional)</h3>
        {standUpSubmitted ? (
          <p className="standup-done" style={{ margin: 0 }}>
            ✅ Stand-up logged. The sim believes in you.
          </p>
        ) : (
          <>
            <div className="standup-grid">
              <textarea
                placeholder="Win / did yesterday"
                value={bullet1}
                onChange={(e) => setBullet1(e.target.value)}
                aria-label="Stand-up bullet one"
              />
              <textarea
                placeholder="Next up"
                value={bullet2}
                onChange={(e) => setBullet2(e.target.value)}
                aria-label="Stand-up bullet two"
              />
            </div>
            <button
              className="btn btn-block"
              style={{ marginTop: 10 }}
              disabled={!bullet1.trim() && !bullet2.trim()}
              onClick={onSubmitStandUp}
            >
              Log stand-up
            </button>
          </>
        )}
      </section>
    </>
  );
}
