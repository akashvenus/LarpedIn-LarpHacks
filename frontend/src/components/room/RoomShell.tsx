import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BackSide, Mesh } from 'three';
import { CRATE, ROOM } from './layout';

const WALL_Z = -ROOM.depth / 2;
const WINDOW_X = ROOM.width / 2;

const COLORS = {
  wall: '#f1ece1',
  accentWall: '#b9c777',
  floor: '#b08a62',
  ceiling: '#faf7f0',
  wood: '#d9b98c',
  woodDark: '#b8946a',
  metal: '#8e96a3',
  fabric: '#3f7fc4',
  bedding: '#6d62b8',
  pillow: '#fff4e0',
  rug: '#f5f1e8',
  sky: '#a8d4f5',
  frame: '#ffffff',
  fridge: '#e4e8ee',
  latch: '#ffd166',
} as const;

interface BoxProps {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

function Box({ position, size, color }: BoxProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Walls() {
  const { width, depth, height } = ROOM;
  return (
    <>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={COLORS.wall} side={BackSide} roughness={1} />
      </mesh>
      <Box position={[0, 0.005, 0]} size={[width, 0.01, depth]} color={COLORS.floor} />
      <Box position={[0, height - 0.005, 0]} size={[width, 0.01, depth]} color={COLORS.ceiling} />
      <Box position={[WINDOW_X - 0.005, height / 2, 0]} size={[0.01, height, depth]} color={COLORS.accentWall} />
    </>
  );
}

function RoomWindow() {
  return (
    <group position={[WINDOW_X - 0.02, 1.6, 0.2]}>
      <Box position={[0, 0, 0]} size={[0.02, 1.5, 2]} color={COLORS.frame} />
      <mesh position={[-0.015, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.84, 1.34]} />
        <meshBasicMaterial color={COLORS.sky} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Desk() {
  return (
    <group position={[0, 0, WALL_Z + 0.4]}>
      <Box position={[0, 0.74, 0]} size={[1.5, 0.04, 0.7]} color={COLORS.wood} />
      <Box position={[-0.65, 0.36, 0]} size={[0.06, 0.72, 0.55]} color={COLORS.metal} />
      <Box position={[0.65, 0.36, 0]} size={[0.06, 0.72, 0.55]} color={COLORS.metal} />
      <Box position={[0, 1.1, -0.3]} size={[0.8, 0.45, 0.03]} color={COLORS.metal} />
      <Box position={[0, 0.46, 0.65]} size={[0.46, 0.06, 0.46]} color={COLORS.fabric} />
      <Box position={[0, 0.76, 0.86]} size={[0.44, 0.55, 0.05]} color={COLORS.fabric} />
      <Box position={[0, 0.22, 0.65]} size={[0.06, 0.44, 0.06]} color={COLORS.metal} />
    </group>
  );
}

function Wardrobe() {
  const x = -ROOM.width / 2 + 0.3;
  return (
    <group position={[x, 0, -1.1]}>
      <Box position={[0, 1.1, 0]} size={[0.6, 2.2, 1.6]} color={COLORS.wood} />
      <Box position={[0.305, 0.5, 0]} size={[0.01, 0.9, 1.5]} color={COLORS.woodDark} />
      <Box position={[0.305, 1.6, 0.4]} size={[0.01, 1, 0.7]} color={COLORS.woodDark} />
      <Box position={[0.2, 1.6, -0.4]} size={[0.25, 0.75, 0.65]} color={COLORS.fridge} />
    </group>
  );
}

function Bed() {
  return (
    <group position={[-ROOM.width / 2 + 0.55, 0, 1.3]}>
      <Box position={[0, 0.2, 0]} size={[1, 0.4, 2]} color={COLORS.woodDark} />
      <Box position={[0, 0.48, 0.05]} size={[0.98, 0.16, 1.85]} color={COLORS.bedding} />
      <Box position={[0, 0.58, -0.75]} size={[0.7, 0.12, 0.35]} color={COLORS.pillow} />
    </group>
  );
}

function Bookshelf() {
  return (
    <group position={[ROOM.width / 2 - 0.2, 0, -1.5]}>
      <Box position={[0, 0.45, 0]} size={[0.35, 0.9, 1.1]} color={COLORS.wood} />
      <Box position={[-0.14, 0.3, -0.2]} size={[0.1, 0.3, 0.1]} color="#ff6b6b" />
      <Box position={[-0.14, 0.3, 0.05]} size={[0.1, 0.34, 0.08]} color="#2e2a5c" />
      <Box position={[-0.14, 0.68, 0.2]} size={[0.1, 0.28, 0.12]} color="#4ecdc4" />
    </group>
  );
}

const MARKER_BASE_Y = 1.15;

/** The item box, with a bobbing marker so it can be found from across the room. */
function Crate() {
  const markerRef = useRef<Mesh>(null);
  const { size } = CRATE;

  useFrame(({ clock }) => {
    if (markerRef.current) {
      markerRef.current.position.y = MARKER_BASE_Y + Math.sin(clock.elapsedTime * 3) * 0.06;
    }
  });

  return (
    <group position={[CRATE.x, 0, CRATE.z]}>
      <Box position={[0, size * 0.35, 0]} size={[size, size * 0.7, size]} color={COLORS.woodDark} />
      <Box position={[0, size * 0.75, 0]} size={[size + 0.06, size * 0.12, size + 0.06]} color={COLORS.wood} />
      <Box position={[0, size * 0.4, size / 2 + 0.005]} size={[size * 0.2, size * 0.3, 0.01]} color={COLORS.latch} />
      <mesh ref={markerRef} position={[0, MARKER_BASE_Y, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 0.2, 4]} />
        <meshBasicMaterial color={COLORS.latch} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Static dorm geometry. Items that come from progress are rendered by the caller. */
export function RoomShell() {
  return (
    <>
      <Walls />
      <RoomWindow />
      <Desk />
      <Wardrobe />
      <Bed />
      <Bookshelf />
      <Crate />
      <mesh position={[0.3, 0.012, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 48]} />
        <meshStandardMaterial color={COLORS.rug} roughness={1} />
      </mesh>
    </>
  );
}

const LED_COLORS = ['#ff4d8d', '#7a5cff', '#2fd8d0'] as const;
const LED_SEGMENT_WIDTH = 0.6;

/** LED strip above the desk, unlocked by publishing the event post. */
export function RgbLights() {
  return (
    <group position={[0, 1.75, WALL_Z + 0.02]}>
      {LED_COLORS.map((color, i) => {
        const x = (i - 1) * LED_SEGMENT_WIDTH;
        return (
          <group key={color} position={[x, 0, 0]}>
            <mesh>
              <boxGeometry args={[LED_SEGMENT_WIDTH, 0.035, 0.02]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <pointLight color={color} position={[0, 0, 0.3]} intensity={1.6} distance={3.5} />
          </group>
        );
      })}
    </group>
  );
}
