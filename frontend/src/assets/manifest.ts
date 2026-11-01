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
  rgbLights: 'assets/rgb-lights.svg',
  giftClosed: 'assets/gift-closed.svg',
  giftOpen: 'assets/gift-open.svg',
  startupStickers: 'assets/startup-stickers.png',
  founderPoster: 'assets/sam-altman-poster.png',
  googleMug: 'assets/google-mug.png',
  mousepad: 'assets/mousepad.png',
};
