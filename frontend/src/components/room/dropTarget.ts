import { DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster } from 'three';
import { RoomItem, SpotId, SPOTS, SPOT_MARKER_SIZE } from '../../domain/items';

/** Resolve a pointer ray against the same compatible planes used by the placement markers. */
export function findDropTarget(item: RoomItem, raycaster: Raycaster): SpotId | undefined {
  const geometry = new PlaneGeometry(item.surface === 'wall' ? SPOT_MARKER_SIZE : item.width, item.surface === 'wall' ? SPOT_MARKER_SIZE : item.height);
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const markers = SPOTS.filter((spot) => spot.surface === item.surface).map((spot) => {
    const mesh = new Mesh(geometry, material);
    const [x, y, z] = spot.position;
    mesh.position.set(x, y + (spot.surface === 'desk' ? item.height * (0.5 - (item.baseInset ?? 0)) : 0), z);
    mesh.rotation.set(...spot.rotation);
    mesh.userData.spotId = spot.id;
    mesh.updateMatrixWorld();
    return mesh;
  });
  const hit = raycaster.intersectObjects(markers)[0];
  geometry.dispose();
  material.dispose();
  return hit?.object.userData.spotId as SpotId | undefined;
}
