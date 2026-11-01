export type AccessoryId = 'glasses' | 'lanyard' | 'propeller-cap';
export type HeldPropId = 'coffee' | 'pitch-deck';

export const ACCESSORIES: { id: AccessoryId; name: string; image: string; unlockXp: number }[] = [
  { id: 'propeller-cap', name: 'Google propeller cap', image: 'assets/room-items/propeller-cap.svg', unlockXp: 0 },
  { id: 'glasses', name: 'Blue-light glasses', image: 'assets/room-items/glasses.svg', unlockXp: 0 },
  { id: 'lanyard', name: 'Speaker badge', image: 'assets/room-items/lanyard.svg', unlockXp: 20 },
];

export const HELD_PROPS: { id: HeldPropId; name: string; image: string; unlockXp: number }[] = [
  { id: 'coffee', name: 'Pre-seed iced coffee', image: 'assets/room-items/coffee.svg', unlockXp: 20 },
  { id: 'pitch-deck', name: 'Pitch deck', image: 'assets/room-items/pitch-deck.svg', unlockXp: 60 },
];
