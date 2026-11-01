import { AVATAR_ITEMS, ROOM_ITEMS } from '../assets/manifest';

export interface InventoryPanelProps {
  open: boolean;
  avatarItem: string;
  roomItems: string[];
  onSelectAvatar: (itemId: string) => void;
  onToggleRoomItem: (itemId: string) => void;
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
  onClose,
}: InventoryPanelProps) {
  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
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
            Dorm items <span className="muted">· tap to place or remove</span>
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
    </div>
  );
}
