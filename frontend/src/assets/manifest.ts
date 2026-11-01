export type AssetName =
  | 'dormBackground'
  | 'avatar'
  | 'avatarMic'
  | 'mic'
  | 'rgbLights'
  | 'giftClosed'
  | 'giftOpen'
  | 'startupStickers'
  | 'founderPoster'
  | 'googleMug'
  | 'mousepad'
  | 'miniWhiteboard' | 'deskPlant' | 'startupBooks' | 'visionBoard' | 'pivotSign' | 'stickyNotes' | 'samaLisa';

export const ASSETS: Record<AssetName, string> = {
  dormBackground: 'assets/dorm-background.jpg',
  avatar: 'assets/avatar.png',
  avatarMic: 'assets/avatar-mic.png',
  mic: 'assets/mic.png',
  rgbLights: 'assets/rgb-lights.png',
  giftClosed: 'assets/gift-closed.svg',
  giftOpen: 'assets/gift-open.svg',
  startupStickers: 'assets/startup-stickers.png',
  founderPoster: 'assets/sam-altman-poster.png',
  googleMug: 'assets/google-mug.png',
  mousepad: 'assets/mousepad.png',
  miniWhiteboard: 'assets/room-items/whiteboard.svg',
  deskPlant: 'assets/room-items/plant.svg',
  startupBooks: 'assets/room-items/books.svg',
  visionBoard: 'assets/room-items/vision-board.svg',
  pivotSign: 'assets/room-items/pivot-sign.svg',
  stickyNotes: 'assets/room-items/sticky-notes.svg',
  samaLisa: 'assets/room-items/sama-lisa.png',
};

/**
 * Inventory catalog (F1/F4).
 * - AVATAR_ITEMS: full-body avatar variants; the dorm renders the selected
 *   one. `scale` visually matches art whose frame padding differs (the
 *   square hoodie frames have padding the portrait frames don't).
 * - ROOM_ITEMS: decor toggled from the inventory. Decor placed by hand comes
 *   from the box in the room instead (see domain/items.ts).
 */
export interface HoodieLook {
  color: string;
  label: string;
}

export interface AvatarItem {
  id: string;
  name: string;
  asset: string;
  /** Visual scale multiplier so variants match in the room. */
  scale?: number;
  /** Outfit on the walkable 3D character, which cannot use the flat art. */
  hoodie?: HoodieLook;
  hasMic?: boolean;
}

export interface RoomItem {
  id: string;
  name: string;
  asset: string;
  /** CSS slot class, e.g. "slot-poster". */
  slot: string;
}

export const AVATAR_ITEMS: AvatarItem[] = [
  { id: 'base', name: 'Default', asset: 'assets/avatar.png', scale: 0.95 },
  {
    id: 'hoodie-waterloo',
    name: 'Waterloo hoodie',
    asset: 'assets/avatar-hoodie-waterloo.png',
    scale: 0.90,
    hoodie: { color: '#2a282c', label: 'WATERLOO' },
  },
  {
    id: 'hoodie-uoft',
    name: 'UofT hoodie',
    asset: 'assets/avatar-hoodie-uoft.png',
    scale: 0.90,
    hoodie: { color: '#1f2c5c', label: 'U OF T' },
  },
  {
    id: 'hoodie-mit',
    name: 'MIT hoodie',
    asset: 'assets/avatar-hoodie-mit.png',
    scale: 0.90,
    hoodie: { color: '#6e2233', label: 'MIT' },
  },
  { id: 'mic', name: 'DJI mic', asset: 'assets/avatar-mic.png', scale: 0.92, hasMic: true },
];

export const ROOM_ITEMS: RoomItem[] = [
  { id: 'rgb-lights', name: 'RGB light bar', asset: 'assets/rgb-lights.png', slot: 'slot-lights' },
];
