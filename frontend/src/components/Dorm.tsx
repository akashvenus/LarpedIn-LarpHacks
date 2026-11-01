import { useState } from 'react';
import { ASSETS } from '../assets/manifest';

export interface DormProps {
  xp: number;
  micUnlocked: boolean;
  lightsUnlocked: boolean;
  standUpSubmitted: boolean;
  standUpBullets: { bullet1: string; bullet2: string } | null;
  onSubmitStandUp: (bullet1: string, bullet2: string) => void;
  onFindEvent: () => void;
}

/**
 * Dorm screen (F1): backdrop, avatar, internship XP bar, unlockable
 * cosmetics in fixed slots, event CTA, and the optional two-bullet
 * stand-up (+5 XP, can never unlock the gift on its own). The completed
 * stand-up keeps its content for the rest of the session.
 */
export function Dorm({
  xp,
  micUnlocked,
  lightsUnlocked,
  standUpSubmitted,
  standUpBullets,
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
          <div className="standup-logged">
            <p className="standup-done" style={{ margin: 0 }}>
              ✅ Stand-up logged
            </p>
            {standUpBullets && (
              <ul className="standup-bullets">
                <li>
                  <strong>Win (did):</strong> {standUpBullets.bullet1 || '—'}
                </li>
                <li>
                  <strong>Next (todo):</strong> {standUpBullets.bullet2 || '—'}
                </li>
              </ul>
            )}
          </div>
        ) : (
          <>
            <div className="standup-grid">
              <textarea
                placeholder="Win (did)"
                value={bullet1}
                onChange={(e) => setBullet1(e.target.value)}
                aria-label="Stand-up: win (did)"
              />
              <textarea
                placeholder="Next (todo)"
                value={bullet2}
                onChange={(e) => setBullet2(e.target.value)}
                aria-label="Stand-up: next (todo)"
              />
            </div>
            <button
              className="btn btn-block"
              style={{ marginTop: 10 }}
              disabled={!bullet1.trim() && !bullet2.trim()}
              onClick={() => onSubmitStandUp(bullet1.trim(), bullet2.trim())}
            >
              Log stand-up
            </button>
          </>
        )}
      </section>
    </>
  );
}
