import { useTexture } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { CSSProperties, MouseEvent, useEffect, useState } from 'react';
import { Raycaster, Vector2 } from 'three';
import { ASSETS, AvatarItem } from '../../assets/manifest';
import { findItem, ItemId, SpotId } from '../../domain/items';
import { AccessoryId, HeldPropId } from '../../domain/gear';
import { findDropTarget } from './dropTarget';
import { ItemBoxPanel } from './ItemBoxPanel';
import { Joystick } from './Joystick';
import { PlacedItems } from './PlacedItems';
import { Player } from './Player';
import { RgbLights, RoomShell } from './RoomShell';
import { useHoldAction } from './useHoldAction';
import { useDragYaw, useMoveInput } from './useRoomControls';

const BOX_HOLD_MS = 700;

export interface DormRoom3DProps {
  avatar: AvatarItem;
  xpPulse: number;
  accessory: AccessoryId | null;
  heldProp: HeldPropId | null;
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
  avatar,
  xpPulse,
  accessory,
  heldProp,
  lightsPlaced,
  unlockedItemIds,
  placements,
  onPlaceItem,
  onRemoveItem,
  carryingId,
  onCarryItem,
}: DormRoom3DProps) {
  const [isNearBox, setIsNearBox] = useState(false);
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const { yawRef, onPointerDown } = useDragYaw(0);

  const carried = carryingId ? findItem(carryingId) : undefined;
  const canOpenBox = isNearBox && !isBoxOpen && !carried;
  const { isHolding, startHold, endHold } = useHoldAction(BOX_HOLD_MS, canOpenBox, () => setIsBoxOpen(true));

  const { readInput, setStick } = useMoveInput({
    onPress: (code) => {
      if (code === 'KeyE') {
        if (isBoxOpen) setIsBoxOpen(false);
        else if (canOpenBox) startHold();
      }
      if (code === 'Escape') {
        setIsBoxOpen(false);
        onCarryItem(null);
      }
    },
    onRelease: (code) => {
      if (code === 'KeyE') endHold();
    },
  });

  // detail is 0 only for keyboard activation, which has no way to hold a pointer.
  const handleBoxButtonClick = (event: MouseEvent) => {
    if (event.detail === 0) setIsBoxOpen(true);
  };

  const handlePick = (itemId: ItemId) => {
    const item = findItem(itemId);
    // Decoded ahead of the tap, so the item appears the moment it is placed.
    if (item) useTexture.preload(ASSETS[item.asset]);
    onCarryItem(itemId);
    setIsBoxOpen(false);
  };

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
            avatar={avatar}
            xpPulse={xpPulse}
            accessory={accessory}
            heldProp={heldProp}
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
          <button className="room-banner-cancel" onClick={() => onCarryItem(null)}>
            Cancel
          </button>
        </div>
      )}

      {!isBoxOpen && <Joystick onChange={setStick} />}

      {canOpenBox && (
        <button
          className={`btn btn-primary room-action${isHolding ? ' is-holding' : ''}`}
          style={{ '--hold-ms': `${BOX_HOLD_MS}ms` } as CSSProperties}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onContextMenu={(event) => event.preventDefault()}
          onClick={handleBoxButtonClick}
        >
          <span className="room-action-fill" aria-hidden="true" />
          <span className="room-action-label">
            <kbd className="room-action-key">E</kbd> Hold to open box
          </span>
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
