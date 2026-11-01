import { AssetName } from '../assets/manifest';

export type ItemId = 'stickers' | 'sama-lisa' | 'poster' | 'mug' | 'mousepad' | 'whiteboard' | 'plant' | 'books' | 'vision' | 'pivot' | 'notes';
export type SpotId =
  | 'wall-desk-left'
  | 'wall-desk-right'
  | 'wall-window'
  | 'wall-bed'
  | 'wall-back-left'
  | 'wall-back-right'
  | 'wall-window-far'
  | 'desk-left'
  | 'desk-right'
  | 'shelf-top'
  | 'bed-foot'
  | 'box-top'
  | 'desk-mat';

/** wall: hung flat; desk: stands on the desk top; mat: lies flat on the desk top. */
export type Surface = 'wall' | 'desk' | 'mat';

export interface RoomItem {
  id: ItemId;
  name: string;
  asset: AssetName;
  surface: Surface;
  /** Rendered size in metres, including the image's transparent margin. */
  width: number;
  height: number;
  /** Fraction of the image height below the visible art; keeps desk items on the surface. */
  baseInset?: number;
  unlockHint: string;
}

export interface RoomSpot {
  id: SpotId;
  surface: Surface;
  /** For desk spots, y is the desk top; otherwise it is the item's centre. */
  position: [number, number, number];
  rotation: [number, number, number];
}

export const ITEMS: readonly RoomItem[] = [
  { id: 'sama-lisa', name: 'Sama Lisa', asset: 'samaLisa', surface: 'wall', width: 0.98, height: 1.4, unlockHint: 'Starter item' },
  { id: 'stickers', name: 'Startup stickers', asset: 'startupStickers', surface: 'wall', width: 1.05, height: 0.7, unlockHint: 'Starter item' },
  { id: 'poster', name: 'Founder poster', asset: 'founderPoster', surface: 'wall', width: 1.4, height: 1.8, unlockHint: 'Select an event' },
  { id: 'mug', name: 'Google mug', asset: 'googleMug', surface: 'desk', width: 0.6, height: 0.4, baseInset: 0.24, unlockHint: 'Log a stand-up' },
  { id: 'mousepad', name: 'Mousepad', asset: 'mousepad', surface: 'mat', width: 0.72, height: 0.48, unlockHint: 'Publish your event post' },
  { id: 'notes', name: 'Inspirational sticky notes', asset: 'stickyNotes', surface: 'wall', width: 0.85, height: 0.7, unlockHint: 'Starter item' },
  { id: 'pivot', name: 'Days since last pivot', asset: 'pivotSign', surface: 'wall', width: 0.7, height: 0.6, unlockHint: 'Select an event' },
  { id: 'vision', name: 'Vision board', asset: 'visionBoard', surface: 'wall', width: 1.05, height: 0.9, unlockHint: 'Publish your event post' },
  { id: 'whiteboard', name: 'Mini whiteboard', asset: 'miniWhiteboard', surface: 'desk', width: 0.58, height: 0.48, unlockHint: 'Select an event' },
  { id: 'plant', name: 'Desk plant', asset: 'deskPlant', surface: 'desk', width: 0.4, height: 0.42, unlockHint: 'Log a stand-up' },
  { id: 'books', name: 'Startup books', asset: 'startupBooks', surface: 'desk', width: 0.48, height: 0.4, unlockHint: 'Log a stand-up' },
];

const FACE_FORWARD: [number, number, number] = [0, 0, 0];
const FACE_BACK: [number, number, number] = [0, Math.PI, 0];
const FACE_WEST: [number, number, number] = [0, -Math.PI / 2, 0];
const FACE_EAST: [number, number, number] = [0, Math.PI / 2, 0];

export const SPOTS: readonly RoomSpot[] = [
  { id: 'wall-desk-left', surface: 'wall', position: [-1.5, 1.6, -2.97], rotation: FACE_FORWARD },
  { id: 'wall-desk-right', surface: 'wall', position: [1.6, 1.7, -2.97], rotation: FACE_FORWARD },
  { id: 'wall-window', surface: 'wall', position: [2.96, 1.6, -1.6], rotation: FACE_WEST },
  { id: 'wall-bed', surface: 'wall', position: [-2.97, 1.6, 1.3], rotation: FACE_EAST },
  { id: 'wall-back-left', surface: 'wall', position: [-1.2, 1.6, 2.97], rotation: FACE_BACK },
  { id: 'wall-back-right', surface: 'wall', position: [1.2, 1.6, 2.97], rotation: FACE_BACK },
  { id: 'wall-window-far', surface: 'wall', position: [2.96, 1.6, 2.05], rotation: FACE_WEST },
  { id: 'desk-left', surface: 'desk', position: [-0.5, 0.76, -2.55], rotation: FACE_FORWARD },
  { id: 'desk-right', surface: 'desk', position: [0.5, 0.76, -2.55], rotation: FACE_FORWARD },
  { id: 'shelf-top', surface: 'desk', position: [2.8, 0.9, -1.5], rotation: FACE_WEST },
  { id: 'bed-foot', surface: 'desk', position: [-2.45, 0.56, 1.8], rotation: FACE_FORWARD },
  { id: 'box-top', surface: 'desk', position: [1.7, 0.648, -2.4], rotation: FACE_FORWARD },
  { id: 'desk-mat', surface: 'mat', position: [0, 0.765, -2.45], rotation: [-Math.PI / 2, 0, 0] },
];

export function findItem(id: ItemId): RoomItem | undefined {
  return ITEMS.find((item) => item.id === id);
}

export function findSpot(id: SpotId): RoomSpot | undefined {
  return SPOTS.find((spot) => spot.id === id);
}
