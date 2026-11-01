import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MutableRefObject, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { CAMERA_BOUNDS, CRATE, CRATE_CENTER, OBSTACLES, PLAYER_RADIUS, WALK_BOUNDS, WARDROBE } from './layout';
import { clearCameraDistance, isWithin, moveWithCollisions, Vec2, worldDirection } from './movement';

const AVATAR_HEIGHT = 1.15;
const WALK_SPEED = 2.2;
/** Caps the step after a dropped frame or a backgrounded tab, which could tunnel through furniture. */
const MAX_FRAME_SECONDS = 0.05;
const CAMERA_DISTANCE = 2.5;
const CAMERA_MIN_DISTANCE = 0.9;
const CAMERA_HEIGHT = 1.6;
const LOOK_HEIGHT = 0.8;
const CAMERA_SMOOTHING = 10;
const WADDLE_RATE = 11;

export const PLAYER_START: Vec2 = { x: 0.3, z: 0.4 };

export interface PlayerProps {
  avatarAsset: string;
  /** Multiplier for looks whose frames have different padding. */
  avatarScale: number;
  isFrozen: boolean;
  readInput: () => { x: number; y: number };
  yawRef: MutableRefObject<number>;
  onNearCrateChange: (isNear: boolean) => void;
}

/** Walking character and its follow camera. Position lives in refs because it changes every frame. */
export function Player({ avatarAsset, avatarScale, isFrozen, readInput, yawRef, onNearCrateChange }: PlayerProps) {
  const texture = useTexture(avatarAsset);
  const image = texture.image as { width: number; height: number };
  const height = AVATAR_HEIGHT * avatarScale;
  const width = (height * image.width) / image.height;
  const rootRef = useRef<Group>(null);
  const spriteRef = useRef<Group>(null);
  const positionRef = useRef<Vec2>(PLAYER_START);
  const walkTimeRef = useRef(0);
  const wasNearRef = useRef<boolean | null>(null);
  const lookAt = useRef(new Vector3());
  const desiredCamera = useRef(new Vector3());

  useFrame(({ camera }, delta) => {
    const root = rootRef.current;
    const sprite = spriteRef.current;
    if (!root || !sprite) return;

    const dt = Math.min(delta, MAX_FRAME_SECONDS);
    const input = isFrozen ? { x: 0, y: 0 } : readInput();
    const direction = worldDirection(input, yawRef.current);
    const step = { x: direction.x * WALK_SPEED * dt, z: direction.z * WALK_SPEED * dt };
    positionRef.current = moveWithCollisions(positionRef.current, step, PLAYER_RADIUS, WALK_BOUNDS, OBSTACLES);
    const { x, z } = positionRef.current;
    root.position.set(x, 0, z);

    const isNear = isWithin(positionRef.current, CRATE_CENTER, CRATE.reach);
    if (isNear !== wasNearRef.current) {
      wasNearRef.current = isNear;
      onNearCrateChange(isNear);
    }

    const isWalking = input.x !== 0 || input.y !== 0;
    walkTimeRef.current = isWalking ? walkTimeRef.current + dt : 0;
    const phase = walkTimeRef.current * WADDLE_RATE;
    sprite.position.y = height / 2 + Math.abs(Math.sin(phase)) * 0.05;
    sprite.rotation.z = Math.sin(phase) * 0.07;

    const yaw = yawRef.current;
    const toCamera = { x: Math.sin(yaw), z: Math.cos(yaw) };
    const distance = clearCameraDistance(
      positionRef.current,
      toCamera,
      CAMERA_DISTANCE,
      CAMERA_MIN_DISTANCE,
      CAMERA_BOUNDS,
      [WARDROBE],
    );
    desiredCamera.current.set(x + toCamera.x * distance, CAMERA_HEIGHT, z + toCamera.z * distance);
    camera.position.lerp(desiredCamera.current, Math.min(1, dt * CAMERA_SMOOTHING));
    camera.lookAt(lookAt.current.set(x, LOOK_HEIGHT, z));

    sprite.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z);
  });

  return (
    <group ref={rootRef} position={[PLAYER_START.x, 0, PLAYER_START.z]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <group ref={spriteRef} position={[0, height / 2, 0]} rotation={[0, 0, 0, 'YXZ']}>
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
