import { useFrame } from '@react-three/fiber';
import { MutableRefObject, useEffect, useMemo, useRef } from 'react';
import { BackSide, CanvasTexture, Group, SRGBColorSpace } from 'three';
import { AvatarItem, HoodieLook } from '../../assets/manifest';
import { dampFactor } from './movement';

const SKIN = '#f7f7f9';
const INK = '#14122b';
const OUTLINE = 0.016;

const HIP_Y = 0.3;
const SHOULDER_Y = 0.56;
const SHOULDER_X = 0.19;
const ARM_REST_ANGLE = 0.32;

const STRIDE_RATE = 10;
const LEG_SWING = 0.65;
const ARM_SWING = 0.45;
const BOB_HEIGHT = 0.035;
/** Blends the walk cycle in and out so the limbs never snap back to the rest pose. */
const POSE_SMOOTHING = 12;

export interface CharacterMotion {
  /** Yaw in radians; 0 faces +z. */
  heading: number;
  /** Current speed as a fraction of walking speed, in [0, 1]. */
  speed: number;
}

interface PartProps {
  radius: number;
  color: string;
  position?: [number, number, number];
  scale?: [number, number, number];
}

/** A sphere with an ink outline drawn from its enlarged back faces. */
function Ball({ radius, color, position, scale }: PartProps) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[radius, 24, 18]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius + OUTLINE, 24, 18]} />
        <meshBasicMaterial color={INK} side={BackSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A vertical capsule of the given straight length, outlined like Ball. */
function Limb({ radius, length, color, position }: PartProps & { length: number }) {
  return (
    <group position={position}>
      <mesh>
        <capsuleGeometry args={[radius, length, 6, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh>
        <capsuleGeometry args={[radius + OUTLINE, length, 6, 16]} />
        <meshBasicMaterial color={INK} side={BackSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Face() {
  return (
    <group position={[0, 0.82, 0]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.135, 0.035, 0.265]} scale={[1, 1, 0.5]}>
          <sphereGeometry args={[0.032, 12, 10]} />
          <meshBasicMaterial color={INK} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0.01, 0.02, 0.298]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.07, 0.009, 8, 20, Math.PI]} />
        <meshBasicMaterial color={INK} toneMapped={false} />
      </mesh>
      <mesh position={[-0.078, 0.012, 0.296]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.02, 0.008, 8, 12, Math.PI * 1.2]} />
        <meshBasicMaterial color={INK} toneMapped={false} />
      </mesh>
    </group>
  );
}

function useLabelTexture(hoodie: HoodieLook | undefined): CanvasTexture | null {
  const texture = useMemo(() => {
    if (!hoodie) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.font = 'bold 44px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.fillText(hoodie.label, 128, 32, 244);
    const label = new CanvasTexture(canvas);
    label.colorSpace = SRGBColorSpace;
    return label;
  }, [hoodie]);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function Hoodie({ hoodie }: { hoodie: HoodieLook }) {
  const label = useLabelTexture(hoodie);
  return (
    <>
      <Ball radius={0.15} color={hoodie.color} position={[0, 0.6, -0.06]} scale={[1.15, 0.8, 1]} />
      {label && (
        <mesh position={[0, 0.44, 0.192]}>
          <planeGeometry args={[0.24, 0.06]} />
          <meshBasicMaterial map={label} transparent toneMapped={false} />
        </mesh>
      )}
    </>
  );
}

function ClipOnMic() {
  return (
    <group position={[-0.08, 0.47, 0.17]}>
      <mesh>
        <boxGeometry args={[0.07, 0.07, 0.03]} />
        <meshBasicMaterial color="#26262b" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <sphereGeometry args={[0.04, 12, 10]} />
        <meshBasicMaterial color="#8d8d94" toneMapped={false} />
      </mesh>
    </group>
  );
}

export interface CharacterProps {
  avatar: AvatarItem;
  motionRef: MutableRefObject<CharacterMotion>;
}

/**
 * Jointed model of the avatar art, which only exists as a front view. Faces +z at heading 0.
 * Keep hoodie and mic details in step with the matching images in public/assets.
 */
export function Character({ avatar, motionRef }: CharacterProps) {
  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const phaseRef = useRef(0);
  const strideRef = useRef(0);

  useFrame((_, delta) => {
    const { heading, speed } = motionRef.current;
    phaseRef.current += delta * STRIDE_RATE * speed;
    strideRef.current += (speed - strideRef.current) * dampFactor(POSE_SMOOTHING, delta);

    const swing = Math.sin(phaseRef.current) * strideRef.current;
    if (rootRef.current) rootRef.current.rotation.y = heading;
    if (bodyRef.current) bodyRef.current.position.y = Math.abs(Math.cos(phaseRef.current)) * BOB_HEIGHT * strideRef.current;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * LEG_SWING;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * LEG_SWING;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * ARM_SWING;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * ARM_SWING;
  });

  const sleeve = avatar.hoodie?.color ?? SKIN;

  return (
    <group ref={rootRef} scale={(avatar.scale ?? 1) / 0.95}>
      <group ref={bodyRef}>
        <group ref={leftLegRef} position={[-0.09, HIP_Y, 0]}>
          <Limb radius={0.075} length={0.14} color={SKIN} position={[0, -0.12, 0]} />
          <Ball radius={0.085} color={SKIN} position={[0, -0.215, 0.04]} scale={[1, 0.8, 1.25]} />
        </group>
        <group ref={rightLegRef} position={[0.09, HIP_Y, 0]}>
          <Limb radius={0.075} length={0.14} color={SKIN} position={[0, -0.12, 0]} />
          <Ball radius={0.085} color={SKIN} position={[0, -0.215, 0.04]} scale={[1, 0.8, 1.25]} />
        </group>

        <Limb radius={0.175} length={0.16} color={sleeve} position={[0, 0.42, 0]} />

        {[
          { side: -1, ref: leftArmRef },
          { side: 1, ref: rightArmRef },
        ].map(({ side, ref }) => (
          <group key={side} ref={ref} position={[side * SHOULDER_X, SHOULDER_Y, 0]}>
            <group rotation={[0, 0, side * ARM_REST_ANGLE]}>
              <Limb radius={0.058} length={0.16} color={sleeve} position={[0, -0.09, 0]} />
              <Ball radius={0.06} color={SKIN} position={[0, -0.2, 0]} />
            </group>
          </group>
        ))}

        {avatar.hoodie && <Hoodie hoodie={avatar.hoodie} />}
        {avatar.hasMic && <ClipOnMic />}

        <Ball radius={0.3} color={SKIN} position={[0, 0.82, 0]} scale={[1.12, 0.92, 1]} />
        <Face />
      </group>
    </group>
  );
}
