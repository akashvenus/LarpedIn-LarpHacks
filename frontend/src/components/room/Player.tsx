import { useFrame } from '@react-three/fiber';
import { MutableRefObject, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { AvatarItem } from '../../assets/manifest';
import { AccessoryId, HeldPropId } from '../../domain/gear';
import { Character, CharacterMotion } from './Character';
import { CAMERA_BOUNDS, CRATE, CRATE_CENTER, OBSTACLES, PLAYER_RADIUS, WALK_BOUNDS, WARDROBE } from './layout';
import {
  clearCameraDistance,
  dampAngle,
  dampFactor,
  dampVelocity,
  headingOf,
  isWithin,
  moveWithCollisions,
  Vec2,
  worldDirection,
} from './movement';

const WALK_SPEED = 2.2;
/** Caps the step after a dropped frame or a backgrounded tab, which could tunnel through furniture. */
const MAX_FRAME_SECONDS = 0.05;
const ACCELERATION_RATE = 12;
const TURN_RATE = 12;
const CAMERA_DISTANCE = 2.5;
const CAMERA_MIN_DISTANCE = 0.9;
const CAMERA_HEIGHT = 1.6;
const LOOK_HEIGHT = 0.8;
const CAMERA_SMOOTHING = 10;

export const PLAYER_START: Vec2 = { x: 0.3, z: 0.4 };

export interface PlayerProps {
  avatar: AvatarItem;
  xpPulse: number;
  accessory: AccessoryId | null;
  heldProp: HeldPropId | null;
  isFrozen: boolean;
  readInput: () => { x: number; y: number };
  yawRef: MutableRefObject<number>;
  onNearCrateChange: (isNear: boolean) => void;
}

/** Walking character and its follow camera. Position lives in refs because it changes every frame. */
export function Player({ avatar, xpPulse, accessory, heldProp, isFrozen, readInput, yawRef, onNearCrateChange }: PlayerProps) {
  const rootRef = useRef<Group>(null);
  const positionRef = useRef<Vec2>(PLAYER_START);
  const velocityRef = useRef<Vec2>({ x: 0, z: 0 });
  const motionRef = useRef<CharacterMotion>({ heading: 0, speed: 0 });
  const wasNearRef = useRef<boolean | null>(null);
  const lookAt = useRef(new Vector3());
  const desiredCamera = useRef(new Vector3());

  useFrame(({ camera }, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const dt = Math.min(delta, MAX_FRAME_SECONDS);
    const input = isFrozen ? { x: 0, y: 0 } : readInput();
    const direction = worldDirection(input, yawRef.current);
    const targetVelocity = { x: direction.x * WALK_SPEED, z: direction.z * WALK_SPEED };
    velocityRef.current = dampVelocity(velocityRef.current, targetVelocity, ACCELERATION_RATE, dt);

    const previous = positionRef.current;
    const step = { x: velocityRef.current.x * dt, z: velocityRef.current.z * dt };
    positionRef.current = moveWithCollisions(previous, step, PLAYER_RADIUS, WALK_BOUNDS, OBSTACLES);
    const { x, z } = positionRef.current;
    root.position.set(x, 0, z);

    // Measured from the distance covered, so the legs stop when walking into a wall.
    const covered = Math.hypot(x - previous.x, z - previous.z);
    const isSteering = input.x !== 0 || input.y !== 0;
    motionRef.current = {
      heading: isSteering
        ? dampAngle(motionRef.current.heading, headingOf(direction), TURN_RATE, dt)
        : motionRef.current.heading,
      speed: dt > 0 ? Math.min(1, covered / (WALK_SPEED * dt)) : 0,
    };

    const isNear = isWithin(positionRef.current, CRATE_CENTER, CRATE.reach);
    if (isNear !== wasNearRef.current) {
      wasNearRef.current = isNear;
      onNearCrateChange(isNear);
    }

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
    camera.position.lerp(desiredCamera.current, dampFactor(CAMERA_SMOOTHING, dt));
    camera.lookAt(lookAt.current.set(x, LOOK_HEIGHT, z));
  });

  return (
    <group ref={rootRef} position={[PLAYER_START.x, 0, PLAYER_START.z]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <Character avatar={avatar} xpPulse={xpPulse} accessory={accessory} heldProp={heldProp} motionRef={motionRef} />
    </group>
  );
}
