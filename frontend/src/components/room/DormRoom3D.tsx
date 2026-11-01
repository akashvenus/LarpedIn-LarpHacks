import { useTexture } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import { ASSETS, AVATAR_ITEMS } from '../../assets/manifest';
import { findItem, ItemId, SpotId } from '../../domain/items';
import { ItemBoxPanel } from './ItemBoxPanel';
import { Joystick } from './Joystick';
import { PlacedItems } from './PlacedItems';
import { Player } from './Player';
import { RgbLights, RoomShell } from './RoomShell';
import { useDragYaw, useMoveInput } from './useRoomControls';

// Switching looks in the inventory must not suspend the canvas and flash the fallback.
AVATAR_ITEMS.forEach((item) => useTexture.preload(item.asset));

export interface DormRoom3DProps {
  avatarAsset: string;
  avatarScale: number;
  lightsPlaced: boolean;
  unlockedItemIds: ItemId[];
  placements: Partial<Record<SpotId, ItemId>>;
  onPlaceItem: (itemId: ItemId, spotId: SpotId) => void;
  onRemoveItem: (spotId: SpotId) => void;
}

/** Walkable dorm: the 3D scene plus its on-screen controls. */
export default function DormRoom3D({
  avatarAsset,
  avatarScale,
  lightsPlaced,
  unlockedItemIds,
  placements,
  onPlaceItem,
  onRemoveItem,
}: DormRoom3DProps) {
  const [isNearBox, setIsNearBox] = useState(false);
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [carryingId, setCarryingId] = useState<ItemId | null>(null);
  const { yawRef, onPointerDown } = useDragYaw(0);

  const { readInput, setStick } = useMoveInput((code) => {
    if (code === 'KeyE' && isNearBox) setIsBoxOpen((open) => !open);
    if (code === 'Escape') {
      setIsBoxOpen(false);
      setCarryingId(null);
    }
  });

  const carried = carryingId ? findItem(carryingId) : undefined;

  const handlePick = (itemId: ItemId) => {
    const item = findItem(itemId);
    // Decoded ahead of the tap, so the item appears the moment it is placed.
    if (item) useTexture.preload(ASSETS[item.asset]);
    setCarryingId(itemId);
    setIsBoxOpen(false);
  };

  const handlePlace = (spotId: SpotId) => {
    if (carryingId) onPlaceItem(carryingId, spotId);
    setCarryingId(null);
  };

  const handlePickUp = (spotId: SpotId, itemId: ItemId) => {
    if (carryingId) return;
    onRemoveItem(spotId);
    setCarryingId(itemId);
  };

  return (
    <div className="room-3d">
      <div
        className="room-canvas"
        role="img"
        aria-label="Your dorm room in 3D. Drag to turn the camera."
        onPointerDown={onPointerDown}
      >
        <Canvas dpr={[1, 2]} camera={{ position: [0.3, 1.6, 2.9], fov: 70, near: 0.05, far: 20 }}>
          <ambientLight intensity={lightsPlaced ? 1.1 : 1.6} />
          <directionalLight position={[-1, 2.4, 1]} intensity={1.4} />
          <RoomShell />
          {lightsPlaced && <RgbLights />}
          <PlacedItems
            placements={placements}
            carryingId={carryingId}
            onPlace={handlePlace}
            onPickUp={handlePickUp}
          />
          <Player
            avatarAsset={avatarAsset}
            avatarScale={avatarScale}
            isFrozen={isBoxOpen}
            readInput={readInput}
            yawRef={yawRef}
            onNearCrateChange={setIsNearBox}
          />
        </Canvas>
      </div>

      {carried && (
        <div className="room-banner" role="status">
          <span>
            Walk to a glowing spot on the {carried.surface === 'wall' ? 'wall' : 'desk'} and tap it to place your{' '}
            {carried.name.toLowerCase()}
          </span>
          <button className="room-banner-cancel" onClick={() => setCarryingId(null)}>
            Cancel
          </button>
        </div>
      )}

      {!isBoxOpen && <Joystick onChange={setStick} />}

      {isNearBox && !isBoxOpen && !carried && (
        <button className="btn btn-primary room-action" onClick={() => setIsBoxOpen(true)}>
          📦 Open box
        </button>
      )}

      {isBoxOpen && (
        <ItemBoxPanel
          unlockedItemIds={unlockedItemIds}
          placements={placements}
          onPick={handlePick}
          onClose={() => setIsBoxOpen(false)}
        />
      )}
    </div>
  );
}
