import { ASSETS } from '../../assets/manifest';
import { ItemId, ITEMS_BY_UNLOCK, SpotId } from '../../domain/items';

export interface ItemBoxPanelProps {
  unlockedItemIds: ItemId[];
  placements: Partial<Record<SpotId, ItemId>>;
  onPick: (itemId: ItemId) => void;
  onClose: () => void;
}

/** Contents of the dorm box. Locked items stay visible with what unlocks them. */
export function ItemBoxPanel({ unlockedItemIds, placements, onPick, onClose }: ItemBoxPanelProps) {
  const placedIds = Object.values(placements);

  return (
    <div className="room-box" role="dialog" aria-label="Item box">
      <div className="room-box-head">
        <strong>📦 Item box</strong>
        <button className="icon-btn" onClick={onClose} aria-label="Close item box">
          ✕
        </button>
      </div>
      <div className="room-box-grid">
        {ITEMS_BY_UNLOCK.map((item) => {
          const isUnlocked = unlockedItemIds.includes(item.id);
          const isPlaced = placedIds.includes(item.id);
          return (
            <button
              key={item.id}
              className={`room-box-item${isUnlocked ? '' : ' locked'}`}
              disabled={!isUnlocked}
              onClick={() => onPick(item.id)}
            >
              <img src={ASSETS[item.asset]} alt="" />
              <strong>{item.name}</strong>
              <span className="muted">
                {!isUnlocked ? `🔒 ${item.unlockHint}` : isPlaced ? 'In room · tap to move' : 'Tap to place'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
