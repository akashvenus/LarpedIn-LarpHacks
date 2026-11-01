import { useState } from 'react';
import { ASSETS, AVATAR_ITEMS } from '../assets/manifest';
import { ItemId, SpotId } from '../domain/items';
import { InventoryPanel } from './InventoryPanel';
import { DormScene } from './room/DormScene';

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
  unlockedItemIds: ItemId[];
  placements: Partial<Record<SpotId, ItemId>>;
  onPlaceItem: (itemId: ItemId, spotId: SpotId) => void;
  onRemoveItem: (spotId: SpotId) => void;
}

/**
 * Dorm screen (F1): internship XP bar, walkable room with a briefcase button
 * (top-right) that opens the inventory of avatar looks and toggled decor,
 * event CTA, and the optional two-bullet stand-up.
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
  unlockedItemIds,
  placements,
  onPlaceItem,
  onRemoveItem,
}: DormProps) {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [carryingId, setCarryingId] = useState<ItemId | null>(null);
  const [isStandUpOpen, setIsStandUpOpen] = useState(false);
  const [standUp, setStandUp] = useState('');
  const bullets = standUp.split('\n').map((line) => line.replace(/^\s*[•*-]\s*/, '').trim()).filter(Boolean);

  const avatarEntry = AVATAR_ITEMS.find((item) => item.id === avatarItem);

  return (
    <>
      <header className="dorm-header">
        <h1 className="brand-logo" aria-label="LarpedIn">Larped<span>in</span></h1>
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
        avatarAsset={avatarEntry?.asset ?? ASSETS.avatar}
        avatarScale={avatarEntry?.scale ?? 1}
        lightsPlaced={roomItems.includes('rgb-lights')}
        unlockedItemIds={unlockedItemIds}
        placements={placements}
        onPlaceItem={onPlaceItem}
        onRemoveItem={onRemoveItem}
        carryingId={carryingId}
        onCarryItem={setCarryingId}
      >
        <button
          className="dorm-inventory-btn"
          onClick={() => setInventoryOpen(true)}
          aria-label="Open inventory"
          title="Inventory"
        >
          🧳
        </button>
      </DormScene>

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
        <p className="muted">Share a win from today and what you plan to do next.</p>
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
                placeholder={'• Win (did)\n• Next (todo)'}
                value={standUp}
                onChange={(e) => setStandUp(e.target.value)}
                aria-label="Stand-up: win and next steps"
              />
            </div>
            <button
              className="btn btn-block"
              style={{ marginTop: 10 }}
              disabled={bullets.length === 0}
              onClick={() => onSubmitStandUp(bullets[0] ?? '', bullets.slice(1).join(' · '))}
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
        unlockedItemIds={unlockedItemIds}
        placements={placements}
        onCarryItem={setCarryingId}
        onDropItem={(itemId, x, y) => {
          window.dispatchEvent(new CustomEvent('room-item-drop', { detail: { itemId, x, y } }));
          setInventoryOpen(false);
        }}
        onClose={() => setInventoryOpen(false)}
      />
    </>
  );
}
