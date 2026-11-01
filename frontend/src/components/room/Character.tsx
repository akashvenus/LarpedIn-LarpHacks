import { useFrame } from '@react-three/fiber';
import { MutableRefObject, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BackSide, CanvasTexture, CatmullRomCurve3, Color, Group, SRGBColorSpace, Vector3 } from 'three';
import { AvatarItem, HoodieLook } from '../../assets/manifest';
import { AccessoryId, HeldPropId } from '../../domain/gear';
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

/** One world-space light direction and two flat tones for every part of the character. */
function CelMaterial({ color }: { color: string }) {
  const uniforms = useMemo(() => ({ baseColor: { value: new Color(color) } }), []);
  useLayoutEffect(() => { uniforms.baseColor.value.set(color); }, [color, uniforms]);
  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={`varying vec3 viewNormal;
        void main() {
          viewNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`}
      fragmentShader={`uniform vec3 baseColor;
        varying vec3 viewNormal;
        void main() {
          vec3 lightDirection = normalize((viewMatrix * vec4(0.7, 1.0, 1.0, 0.0)).xyz);
          float lit = step(0.25, dot(normalize(viewNormal), lightDirection));
          vec3 shade = baseColor * vec3(0.52, 0.68, 0.96);
          gl_FragColor = vec4(mix(shade, baseColor, lit), 1.0);
          #include <colorspace_fragment>
        }`}
    />
  );
}

/** A sphere with an ink outline drawn from its enlarged back faces. */
function Ball({ radius, color, position, scale }: PartProps) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[radius, 24, 18]} />
        <CelMaterial color={color} />
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
        <CelMaterial color={color} />
      </mesh>
      <mesh>
        <capsuleGeometry args={[radius + OUTLINE, length, 6, 16]} />
        <meshBasicMaterial color={INK} side={BackSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Face() {
  const cheek = useMemo(() => new CatmullRomCurve3([
    new Vector3(-0.085, 0.037, 0.315),
    new Vector3(-0.067, 0.027, 0.315),
    new Vector3(-0.064, 0.008, 0.315),
    new Vector3(-0.075, -0.009, 0.315),
    new Vector3(-0.095, -0.012, 0.315),
    new Vector3(-0.108, -0.006, 0.315),
  ]), []);
  return (
    <group position={[0, 0.82, 0]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.135, 0.035, 0.265]} scale={[1, 1.15, 0.5]}>
          <sphereGeometry args={[0.026, 12, 10]} />
          <meshBasicMaterial color={INK} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0.025, 0.02, 0.315]} rotation={[0, 0, Math.PI]} scale={[1.2, 0.3, 1]}>
        <torusGeometry args={[0.07, 0.009, 8, 20, Math.PI]} />
        <meshBasicMaterial color={INK} toneMapped={false} />
      </mesh>
      <mesh position={[-0.18, 0.165, 0.19]} rotation={[0, 0, -0.3]}>
        <torusGeometry args={[0.04, 0.006, 8, 20, Math.PI]} />
        <meshBasicMaterial color={INK} toneMapped={false} />
      </mesh>
      <mesh position={[0.18, 0.165, 0.19]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.04, 0.006, 8, 20, Math.PI]} />
        <meshBasicMaterial color={INK} toneMapped={false} />
      </mesh>
      <mesh>
        <tubeGeometry args={[cheek, 32, 0.006, 8, false]} />
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

function HoodieTorso({ color }: { color: string }) {
  return (
    <group position={[0, 0.43, 0]}>
      <mesh>
        <cylinderGeometry args={[0.175, 0.175, 0.26, 32]} />
        <CelMaterial color={color} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.175 + OUTLINE, 0.175 + OUTLINE, 0.26 + OUTLINE * 2, 32]} />
        <meshBasicMaterial color={INK} side={BackSide} toneMapped={false} />
      </mesh>
    </group>
  );
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
        <CelMaterial color="#26262b" />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <sphereGeometry args={[0.04, 12, 10]} />
        <CelMaterial color="#8d8d94" />
      </mesh>
    </group>
  );
}

function PropellerCap({ xpPulse }: { xpPulse: number }) {
  const propeller = useRef<Group>(null);
  const spinRemaining = useRef(0);
  const reducedMotion = useRef(false);
  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!preference) return;
    const update = () => { reducedMotion.current = preference.matches; };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (xpPulse > 0 && !reducedMotion.current) spinRemaining.current = 2;
  }, [xpPulse]);
  useFrame((_, delta) => {
    if (!propeller.current || reducedMotion.current) return;
    const boost = Math.min(delta, spinRemaining.current);
    propeller.current.rotation.y += delta * Math.PI * 2 + boost * Math.PI * 3;
    spinRemaining.current -= boost;
  });
  return (
    <group position={[0, 1.035, 0]}>
      {['#ea4335', '#fbbc04', '#34a853', '#4285f4'].map((color, index) => (
        <mesh key={color} scale={[1.15, 0.65, 1]}>
          <sphereGeometry args={[0.24, 16, 12, index * Math.PI / 2, Math.PI / 2, 0, Math.PI / 2]} />
          <CelMaterial color={color} />
        </mesh>
      ))}
      <mesh position={[0, -0.006, 0.12]} scale={[1.15, 0.23, 0.75]}>
        <sphereGeometry args={[0.24, 24, 12]} /><CelMaterial color="#4285f4" />
      </mesh>
      <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.008, 0.008, 0.07, 8]} /><meshBasicMaterial color={INK} /></mesh>
      <group ref={propeller} position={[0, 0.22, 0]}>
        <mesh position={[-0.09, 0, 0]}><boxGeometry args={[0.18, 0.012, 0.045]} /><CelMaterial color="#ea4335" /></mesh>
        <mesh position={[0.09, 0, 0]}><boxGeometry args={[0.18, 0.012, 0.045]} /><CelMaterial color="#fbbc04" /></mesh>
        <mesh><sphereGeometry args={[0.018, 12, 8]} /><CelMaterial color="#4285f4" /></mesh>
      </group>
    </group>
  );
}

const SPEAKER_LABEL: HoodieLook = { color: '#ffffff', label: 'SPEAKER' };
function Accessory({ item, xpPulse }: { item: AccessoryId; xpPulse: number }) {
  const label = useLabelTexture(item === 'lanyard' ? SPEAKER_LABEL : undefined);
  if (item === 'propeller-cap') return <PropellerCap xpPulse={xpPulse} />;
  if (item === 'glasses') return (
    <group position={[0, 0.855, 0.307]}>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 0.135, 0, 0]}>
        <torusGeometry args={[0.052, 0.007, 8, 24]} /><meshBasicMaterial color={INK} toneMapped={false} />
      </mesh>)}
      <mesh><boxGeometry args={[0.16, 0.009, 0.01]} /><meshBasicMaterial color={INK} toneMapped={false} /></mesh>
    </group>
  );
  return (
    <group>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 0.065, 0.52, 0.18]} rotation={[0, 0, side * 0.5]}>
        <cylinderGeometry args={[0.008, 0.008, 0.18, 8]} /><meshBasicMaterial color="#0a66c2" toneMapped={false} />
      </mesh>)}
      <mesh position={[0, 0.405, 0.205]}><boxGeometry args={[0.115, 0.09, 0.015]} /><meshBasicMaterial color="#faf8ef" toneMapped={false} /></mesh>
      {label && <mesh position={[0, 0.405, 0.214]}><planeGeometry args={[0.1, 0.027]} /><meshBasicMaterial map={label} transparent color="#0a66c2" toneMapped={false} /></mesh>}
    </group>
  );
}

const PITCH_LABEL: HoodieLook = { color: '#25354d', label: 'UBER FOR…' };
const COFFEE_LABEL: HoodieLook = { color: '#fff5d7', label: 'PRE-SEED FUEL' };
function HeldItem({ item }: { item: HeldPropId }) {
  const label = useLabelTexture(item === 'pitch-deck' ? PITCH_LABEL : COFFEE_LABEL);
  if (item === 'coffee') return (
    <group position={[0.08, -0.22, 0.12]}>
      <mesh><cylinderGeometry args={[0.095, 0.065, 0.24, 20]} /><CelMaterial color="#c88a55" /></mesh>
      <mesh position={[0, 0.125, 0]}><cylinderGeometry args={[0.1, 0.1, 0.025, 20]} /><CelMaterial color="#f4efe2" /></mesh>
      <mesh position={[0.04, 0.19, 0]} rotation={[0, 0, -0.25]}><cylinderGeometry args={[0.007, 0.007, 0.13, 8]} /><CelMaterial color="#3c765d" /></mesh>
      <mesh position={[0, 0, 0.097]}><planeGeometry args={[0.15, 0.05]} /><meshBasicMaterial color="#fff5d7" toneMapped={false} /></mesh>
      {label && <mesh position={[0, 0, 0.099]}><planeGeometry args={[0.14, 0.035]} /><meshBasicMaterial map={label} transparent color="#242238" toneMapped={false} /></mesh>}
    </group>
  );
  return (
    <group position={[0.08, -0.22, 0.12]}>
      <mesh><boxGeometry args={[0.22, 0.24, 0.025]} /><CelMaterial color="#26364c" /></mesh>
      <mesh position={[0, 0, 0.014]}><planeGeometry args={[0.19, 0.2]} /><meshBasicMaterial color="#e6f1fa" toneMapped={false} /></mesh>
      {label && <mesh position={[0, 0, 0.016]}><planeGeometry args={[0.18, 0.045]} /><meshBasicMaterial map={label} transparent toneMapped={false} color="#0a66c2" /></mesh>}
    </group>
  );
}

export interface CharacterProps {
  avatar: AvatarItem;
  xpPulse: number;
  accessory: AccessoryId | null;
  heldProp: HeldPropId | null;
  motionRef: MutableRefObject<CharacterMotion>;
}

/**
 * Jointed model of the avatar art, which only exists as a front view. Faces +z at heading 0.
 * Keep hoodie and mic details in step with the matching images in public/assets.
 */
export function Character({ avatar, xpPulse, accessory, heldProp, motionRef }: CharacterProps) {
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
    <group ref={rootRef}>
      <group ref={bodyRef}>
        <group ref={leftLegRef} position={[-0.09, HIP_Y, 0]}>
          <Limb radius={0.075} length={0.14} color={SKIN} position={[0, -0.12, 0]} />
          <Ball radius={0.085} color={SKIN} position={[0, -0.215, 0.04]} scale={[1, 0.8, 1.25]} />
        </group>
        <group ref={rightLegRef} position={[0.09, HIP_Y, 0]}>
          <Limb radius={0.075} length={0.14} color={SKIN} position={[0, -0.12, 0]} />
          <Ball radius={0.085} color={SKIN} position={[0, -0.215, 0.04]} scale={[1, 0.8, 1.25]} />
        </group>

        {avatar.hoodie
          ? <HoodieTorso color={avatar.hoodie.color} />
          : <Limb radius={0.175} length={0.16} color={SKIN} position={[0, 0.42, 0]} />}

        {[
          { side: -1, ref: leftArmRef },
          { side: 1, ref: rightArmRef },
        ].map(({ side, ref }) => (
          <group key={side} ref={ref} position={[side * SHOULDER_X, SHOULDER_Y, 0]}>
            <group rotation={[0, 0, side * ARM_REST_ANGLE]}>
              <Limb radius={0.058} length={0.16} color={sleeve} position={[0, -0.09, 0]} />
              <Ball radius={0.06} color={SKIN} position={[0, -0.2, 0]} />
              {side === 1 && heldProp && <HeldItem item={heldProp} />}
            </group>
          </group>
        ))}

        {avatar.hoodie && <Hoodie hoodie={avatar.hoodie} />}
        {avatar.hasMic && <ClipOnMic />}

        <group position={[0, 0.82, 0]} scale={[1.15, 0.9, 1]}>
          <mesh>
            <sphereGeometry args={[0.3, 48, 32]} />
            <CelMaterial color={SKIN} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.3 + OUTLINE, 48, 32]} />
            <meshBasicMaterial color={INK} side={BackSide} toneMapped={false} />
          </mesh>
        </group>
        <Face />
        {accessory && <Accessory item={accessory} xpPulse={xpPulse} />}
      </group>
    </group>
  );
}
