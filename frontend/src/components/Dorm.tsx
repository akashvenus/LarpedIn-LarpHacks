import { useState } from 'react';
import { ASSETS, AVATAR_ITEMS, ROOM_ITEMS } from '../assets/manifest';
import { InventoryPanel } from './InventoryPanel';

export interface DormProps {
  xp: number;
  standUpSubmitted: boolean;
  standUpBullets: { bullet1: string; bullet2: string } | null;
  onSubmitStandUp: (bullet1: string, bullet2: string) => void;
  onFindEvent: () => void;
  avatarItem: string;
  roomItems: string[];
  onSelectAvatar: (itemId: string) => void;
  onToggleRoomItem: (itemId: string) => void;
}

/**
 * Dorm screen (F1): room backdrop with the avatar in a fixed anchor,
 * a briefcase button (top-right of the room view) that opens the
 * inventory — one panel for avatar looks and static room decor — plus
 * the XP bar, event CTA, and the optional two-bullet stand-up.
 */
export function Dorm({
  xp,
  standUpSubmitted,
  standUpBullets,
  onSubmitStandUp,
  onFindEvent,
  avatarItem,
  roomItems,
  onSelectAvatar,
  onToggleRoomItem,
}: DormProps) {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [bullet1, setBullet1] = useState('');
  const [bullet2, setBullet2] = useState('');

  const avatarEntry = AVATAR_ITEMS.find((item) => item.id === avatarItem);
  const avatarAsset = avatarEntry?.asset ?? ASSETS.avatar;
  const avatarScale = avatarEntry?.scale ?? 1;

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
        {ROOM_ITEMS.filter((item) => roomItems.includes(item.id)).map((item) => (
          <div key={item.id} className={`dorm-slot ${item.slot}`}>
            <img className="item" src={item.asset} alt={`${item.name}, placed`} />
          </div>
        ))}
        <div className="dorm-slot slot-avatar">
          <img
            className="item"
            src={avatarAsset}
            style={avatarScale !== 1 ? { transform: `scale(${avatarScale})` } : undefined}
            alt="You, in the dorm"
          />
        </div>
        <button
          className="dorm-inventory-btn"
          onClick={() => setInventoryOpen(true)}
          aria-label="Open inventory"
          title="Inventory"
        >
          🧳
        </button>
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

      <InventoryPanel
        open={inventoryOpen}
        avatarItem={avatarItem}
        roomItems={roomItems}
        onSelectAvatar={onSelectAvatar}
        onToggleRoomItem={onToggleRoomItem}
        onClose={() => setInventoryOpen(false)}
      />
    </>
  );
}
