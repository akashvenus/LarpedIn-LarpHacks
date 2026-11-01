import { useTexture } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { MeshBasicMaterial } from 'three';
import { ASSETS } from '../../assets/manifest';
import { findItem, ItemId, RoomItem, RoomSpot, SpotId, SPOTS } from '../../domain/items';

export interface PlacedItemsProps {
  placements: Partial<Record<SpotId, ItemId>>;
  carryingId: ItemId | null;
  onPlace: (spotId: SpotId) => void;
  onPickUp: (spotId: SpotId, itemId: ItemId) => void;
}

/** Pointer travel in pixels beyond which a press was a camera drag, not a tap. */
const TAP_MAX_TRAVEL = 6;

function onTap(handler: () => void) {
  return (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > TAP_MAX_TRAVEL) return;
    event.stopPropagation();
    handler();
  };
}

function itemPosition(item: RoomItem, spot: RoomSpot): [number, number, number] {
  if (spot.surface !== 'desk') return spot.position;
  const [x, y, z] = spot.position;
  return [x, y + item.height * (0.5 - (item.baseInset ?? 0)), z];
}

function PlacedItem({ item, spot, onTapItem }: { item: RoomItem; spot: RoomSpot; onTapItem: () => void }) {
  const texture = useTexture(ASSETS[item.asset]);
  return (
    <mesh position={itemPosition(item, spot)} rotation={spot.rotation} onClick={onTap(onTapItem)}>
      <planeGeometry args={[item.width, item.height]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.6} toneMapped={false} />
    </mesh>
  );
}

function SpotMarker({ item, spot, onTapSpot }: { item: RoomItem; spot: RoomSpot; onTapSpot: () => void }) {
  const materialRef = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.opacity = 0.4 + Math.sin(clock.elapsedTime * 4) * 0.15;
    }
  });

  return (
    <mesh position={itemPosition(item, spot)} rotation={spot.rotation} onClick={onTap(onTapSpot)}>
      <planeGeometry args={[item.width, item.height]} />
      <meshBasicMaterial ref={materialRef} color="#ffd166" transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Items in the room, plus tappable markers on the free spots that fit the carried item. */
export function PlacedItems({ placements, carryingId, onPlace, onPickUp }: PlacedItemsProps) {
  const carried = carryingId ? findItem(carryingId) : undefined;

  return (
    <>
      {SPOTS.map((spot) => {
        const placedId = placements[spot.id];
        const placed = placedId ? findItem(placedId) : undefined;
        if (placedId && placed) {
          return (
            // Separate boundary: a texture still loading must not suspend the whole canvas.
            <Suspense key={spot.id} fallback={null}>
              <PlacedItem item={placed} spot={spot} onTapItem={() => onPickUp(spot.id, placedId)} />
            </Suspense>
          );
        }
        if (carried && carried.surface === spot.surface) {
          return <SpotMarker key={spot.id} item={carried} spot={spot} onTapSpot={() => onPlace(spot.id)} />;
        }
        return null;
      })}
    </>
  );
}
