import { useRef, useState } from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import { ASSETS } from '../assets/manifest';
import { ItemId, ITEMS, ITEMS_BY_UNLOCK, SpotId } from '../domain/items';
import { ACCESSORIES, HELD_PROPS, AccessoryId, HeldPropId } from '../domain/gear';
import { AVATAR_ITEMS, ROOM_ITEMS } from '../assets/manifest';
import { shouldDismissInventory } from './inventorySwipe';

export interface InventoryPanelProps {
  open: boolean;
  avatarItem: string;
  accessory: AccessoryId | null;
  heldProp: HeldPropId | null;
  xp: number;
  onSelectAccessory: (itemId: AccessoryId | null) => void;
  onSelectHeldProp: (itemId: HeldPropId | null) => void;
  roomItems: string[];
  onSelectAvatar: (itemId: string) => void;
  onToggleRoomItem: (itemId: string) => void;
  unlockedItemIds: ItemId[];
  placements: Partial<Record<SpotId, ItemId>>;
  onCarryItem: (itemId: ItemId | null) => void;
  onDropItem: (itemId: ItemId, x: number, y: number) => void;
  onClose: () => void;
}

/**
 * Inventory bottom sheet (F1): dress the avatar (full-body variants) and
 * toggle static dorm decor on/off. One panel for equippables and
 * placeables.
 */
export function InventoryPanel({
  open,
  avatarItem,
  accessory,
  heldProp,
  xp,
  onSelectAccessory,
  onSelectHeldProp,
  roomItems,
  onSelectAvatar,
  onToggleRoomItem,
  unlockedItemIds,
  placements,
  onCarryItem,
  onDropItem,
  onClose,
}: InventoryPanelProps) {
  const dragRef = useRef<{ itemId: ItemId; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState<{ itemId: ItemId; x: number; y: number } | null>(null);
  const swipeRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className={`sheet${swipeOffset > 0 ? ' is-swiping' : ''}`}
        role="dialog"
        aria-label="Inventory"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        style={{ transform: `translateY(${swipeOffset}px)` }}
      >
        <header className="sheet-header"
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
            swipeRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const swipe = swipeRef.current;
            if (!swipe || swipe.pointerId !== event.pointerId) return;
            const down = event.clientY - swipe.y;
            setSwipeOffset(down > Math.abs(event.clientX - swipe.x) ? Math.max(0, down) : 0);
          }}
          onPointerUp={(event) => {
            const swipe = swipeRef.current;
            if (!swipe || swipe.pointerId !== event.pointerId) return;
            swipeRef.current = null;
            setSwipeOffset(0);
            if (shouldDismissInventory(swipe.x, swipe.y, event.clientX, event.clientY)) onClose();
          }}
          onPointerCancel={() => { swipeRef.current = null; setSwipeOffset(0); }}>
          <span className="sheet-handle" aria-hidden="true" />
          <div className="sheet-header-row">
            <h2 style={{ margin: 0 }}><BriefcaseBusiness size={20} aria-hidden="true" /> Inventory</h2>
            <button className="icon-btn sheet-close" onClick={onClose} aria-label="Close inventory">
              ✕
            </button>
          </div>
        </header>

        <section>
          <h3 className="inv-title">Place in your room</h3>
          <p className="inv-hint">Drag an item onto a glowing spot, or tap an item and then a spot.</p>
          <div className="placeable-row">
            {ITEMS_BY_UNLOCK.map((item) => {
              const unlocked = unlockedItemIds.includes(item.id);
              const placed = Object.values(placements).includes(item.id);
              return <button key={item.id} type="button" className="room-box-item placeable-tile" disabled={!unlocked}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = { itemId: item.id, x: event.clientX, y: event.clientY, moved: false };
                  onCarryItem(item.id);
                }}
                onPointerMove={(event) => {
                  const drag = dragRef.current;
                  if (!drag || drag.itemId !== item.id) return;
                  if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) drag.moved = true;
                  if (drag.moved) setGhost({ itemId: item.id, x: event.clientX, y: event.clientY });
                }}
                onPointerUp={(event) => {
                  const drag = dragRef.current;
                  dragRef.current = null;
                  setGhost(null);
                  if (drag?.moved) {
                    suppressClick.current = true;
                    window.setTimeout(() => { suppressClick.current = false; }, 0);
                    onDropItem(item.id, event.clientX, event.clientY);
                  }
                }}
                onPointerCancel={() => { dragRef.current = null; setGhost(null); onCarryItem(null); }}
                onClick={() => {
                  if (suppressClick.current) { suppressClick.current = false; return; }
                  onCarryItem(item.id);
                  onClose();
                }}>
                <img src={ASSETS[item.asset]} alt="" draggable={false} />
                <strong>{item.name}</strong>
                <span className="muted">{!unlocked ? `🔒 ${item.unlockHint}` : placed ? 'Placed' : 'Drag or tap'}</span>
              </button>;
            })}
          </div>
        </section>
        <section>
          <h3 className="inv-title">Avatar look</h3>
          <div className="avatar-look-row">
            {AVATAR_ITEMS.map((item) => {
              const selected = avatarItem === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`inv-tile${selected ? ' sel' : ''}`}
                  aria-pressed={selected}
                  onClick={() => onSelectAvatar(item.id)}
                >
                  <img src={item.asset} alt={item.name} />
                  <span className="inv-name">{item.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="inv-title">Wear</h3>
          <div className="avatar-look-row">
            {[...ACCESSORIES].sort((a, b) => a.unlockXp - b.unlockXp).map((item) => <button key={item.id} type="button" className={`inv-tile${accessory === item.id ? ' sel' : ''}`}
              aria-pressed={accessory === item.id} disabled={xp < item.unlockXp}
              onClick={() => onSelectAccessory(accessory === item.id ? null : item.id)}>
              <img src={item.image} alt="" /><span className="inv-name">{item.name}</span>
              {xp < item.unlockXp && <span className="inv-name">Unlock at {item.unlockXp} XP</span>}
            </button>)}
          </div>
        </section>
        <section>
          <h3 className="inv-title">Hold</h3>
          <div className="avatar-look-row">
            {[...HELD_PROPS].sort((a, b) => a.unlockXp - b.unlockXp).map((item) => <button key={item.id} type="button" className={`inv-tile${heldProp === item.id ? ' sel' : ''}`}
              aria-pressed={heldProp === item.id} disabled={xp < item.unlockXp}
              onClick={() => onSelectHeldProp(heldProp === item.id ? null : item.id)}>
              <img src={item.image} alt="" /><span className="inv-name">{item.name}</span>
              {xp < item.unlockXp && <span className="inv-name">Unlock at {item.unlockXp} XP</span>}
            </button>)}
          </div>
        </section>
        <section>
          <h3 className="inv-title">
            Room lighting
          </h3>
          <div className="room-item-grid">
            {ROOM_ITEMS.map((item) => {
              const placed = roomItems.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`room-tile${placed ? ' on' : ''}`}
                  aria-pressed={placed}
                  onClick={() => onToggleRoomItem(item.id)}
                >
                  <img src={item.asset} alt={item.name} />
                  <span className="room-tile-name">{item.name}</span>
                  <span className={`room-tile-state${placed ? ' on' : ''}`}>
                    {placed ? 'Placed' : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      {ghost && <img className="drag-ghost" src={ASSETS[ITEMS.find((item) => item.id === ghost.itemId)!.asset]} alt="" style={{ left: ghost.x, top: ghost.y }} />}
    </div>
  );
}
