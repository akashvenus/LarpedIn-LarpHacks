import { useRef, useState } from 'react';
import { ASSETS } from '../assets/manifest';
import { ItemId, ITEMS, SpotId } from '../domain/items';
import { AVATAR_ITEMS, ROOM_ITEMS } from '../assets/manifest';

export interface InventoryPanelProps {
  open: boolean;
  avatarItem: string;
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
  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-label="Inventory"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet-header">
          <h2 style={{ margin: 0 }}>🧳 Inventory</h2>
          <button className="icon-btn sheet-close" onClick={onClose} aria-label="Close inventory">
            ✕
          </button>
        </header>

        <section>
          <h3 className="inv-title">Place in your room</h3>
          <p className="inv-hint">Drag an item onto a glowing spot, or tap an item and then a spot.</p>
          <div className="placeable-row">
            {ITEMS.map((item) => {
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
