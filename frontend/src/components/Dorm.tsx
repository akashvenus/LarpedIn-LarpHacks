import { useState } from 'react';
import { ItemId, SpotId } from '../domain/items';
import { DormScene } from './room/DormScene';

export interface DormProps {
  xp: number;
  micUnlocked: boolean;
  lightsUnlocked: boolean;
  standUpSubmitted: boolean;
  standUpBullets: { bullet1: string; bullet2: string } | null;
  onSubmitStandUp: (bullet1: string, bullet2: string) => void;
  onFindEvent: () => void;
  unlockedItemIds: ItemId[];
  placements: Partial<Record<SpotId, ItemId>>;
  onPlaceItem: (itemId: ItemId, spotId: SpotId) => void;
  onRemoveItem: (spotId: SpotId) => void;
}

/**
 * Dorm screen (F1): internship XP bar, walkable room with unlockable
 * cosmetics, event CTA, and the optional two-bullet
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
  unlockedItemIds,
  placements,
  onPlaceItem,
  onRemoveItem,
}: DormProps) {
  const [bullet1, setBullet1] = useState('');
  const [bullet2, setBullet2] = useState('');
  const [isStandUpOpen, setIsStandUpOpen] = useState(false);

  return (
    <>
      <header className="dorm-header">
        <h1>LarpedIn</h1>
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

      <DormScene
        micUnlocked={micUnlocked}
        lightsUnlocked={lightsUnlocked}
        unlockedItemIds={unlockedItemIds}
        placements={placements}
        onPlaceItem={onPlaceItem}
        onRemoveItem={onRemoveItem}
      />

      <div className="dorm-cta-row">
        <button className="btn btn-primary" onClick={onFindEvent}>
          📅 Find an event
        </button>
        <button
          className="btn"
          aria-expanded={isStandUpOpen}
          aria-controls="dorm-standup"
          onClick={() => setIsStandUpOpen((open) => !open)}
        >
          {standUpSubmitted ? '✅ Stand-up' : '📝 Stand-up +5 XP'}
        </button>
      </div>

      <section className="card dorm-standup" id="dorm-standup" hidden={!isStandUpOpen}>
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
