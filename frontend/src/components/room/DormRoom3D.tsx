import { useTexture } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Raycaster, Vector2 } from 'three';
import { AVATAR_ITEMS } from '../../assets/manifest';
import { findItem, ItemId, SpotId } from '../../domain/items';
import { findDropTarget } from './dropTarget';
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
  carryingId: ItemId | null;
  onCarryItem: (itemId: ItemId | null) => void;
}

/** Walkable dorm: the 3D scene plus its on-screen controls. */
export default function DormRoom3D({
  avatarAsset,
  avatarScale,
  lightsPlaced,
  placements,
  onPlaceItem,
  onRemoveItem,
  carryingId,
  onCarryItem,
}: DormRoom3DProps) {
  const { yawRef, onPointerDown } = useDragYaw(0);
  const { readInput, setStick } = useMoveInput((code) => {
    if (code === 'Escape') onCarryItem(null);
  });
  const carried = carryingId ? findItem(carryingId) : undefined;

  const handlePlace = (spotId: SpotId) => {
    if (carryingId) onPlaceItem(carryingId, spotId);
    onCarryItem(null);
  };

  const handlePickUp = (spotId: SpotId, itemId: ItemId) => {
    if (carryingId) return;
    onRemoveItem(spotId);
    onCarryItem(itemId);
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
          <DropHandler onPlaceItem={onPlaceItem} onCarryItem={onCarryItem} />
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
            isFrozen={false}
            readInput={readInput}
            yawRef={yawRef}
            onNearCrateChange={() => {}}
          />
        </Canvas>
      </div>

      {carried && (
        <div className="room-banner" role="status">
          <span>
            Walk to a glowing spot on the {carried.surface === 'wall' ? 'wall' : 'desk'} and tap it to place your{' '}
            {carried.name.toLowerCase()}
          </span>
          <button className="room-banner-cancel" onClick={() => onCarryItem(null)}>
            Cancel
          </button>
        </div>
      )}

      <Joystick onChange={setStick} />

    </div>
  );
}

function DropHandler({ onPlaceItem, onCarryItem }: Pick<DormRoom3DProps, 'onPlaceItem' | 'onCarryItem'>) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const handleDrop = (raw: Event) => {
      const { itemId, x, y } = (raw as CustomEvent<{ itemId: ItemId; x: number; y: number }>).detail;
      const item = findItem(itemId);
      const rect = gl.domElement.getBoundingClientRect();
      if (!item || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return;
      const raycaster = new Raycaster();
      raycaster.setFromCamera(new Vector2((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1), camera);
      const spotId = findDropTarget(item, raycaster);
      if (spotId) {
        onPlaceItem(itemId, spotId);
        onCarryItem(null);
      }
    };
    window.addEventListener('room-item-drop', handleDrop);
    return () => window.removeEventListener('room-item-drop', handleDrop);
  }, [camera, gl, onPlaceItem, onCarryItem]);
  return null;
}
