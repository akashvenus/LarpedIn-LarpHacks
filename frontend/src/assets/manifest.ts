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
  | 'mousepad';

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
};

/**
 * Inventory catalog (F1/F4).
 * - AVATAR_ITEMS: full-body avatar variants; the dorm renders the selected
 *   one. `scale` visually matches art whose frame padding differs (the
 *   square hoodie frames have padding the portrait frames don't).
 * - ROOM_ITEMS: decor toggled from the inventory. Decor placed by hand comes
 *   from the box in the room instead (see domain/items.ts).
 */
export interface AvatarItem {
  id: string;
  name: string;
  asset: string;
  /** Visual scale multiplier so variants match in the room. */
  scale?: number;
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
  { id: 'hoodie-waterloo', name: 'Waterloo hoodie', asset: 'assets/avatar-hoodie-waterloo.png', scale: 0.90 },
  { id: 'hoodie-uoft', name: 'UofT hoodie', asset: 'assets/avatar-hoodie-uoft.png', scale: 0.90 },
  { id: 'hoodie-mit', name: 'MIT hoodie', asset: 'assets/avatar-hoodie-mit.png', scale: 0.90 },
  { id: 'mic', name: 'DJI mic', asset: 'assets/avatar-mic.png', scale: 0.92 },
];

export const ROOM_ITEMS: RoomItem[] = [
  { id: 'rgb-lights', name: 'RGB light bar', asset: 'assets/rgb-lights.png', slot: 'slot-lights' },
];
