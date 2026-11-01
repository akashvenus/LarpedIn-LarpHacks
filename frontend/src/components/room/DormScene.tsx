import { Component, lazy, ReactNode, Suspense, useState } from 'react';
import { ASSETS } from '../../assets/manifest';
import type { DormRoom3DProps } from './DormRoom3D';

const DormRoom3D = lazy(() => import('./DormRoom3D'));

function supportsWebGL(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null
      || document.createElement('canvas').getContext('webgl') !== null;
  } catch {
    return false;
  }
}

/** Any failure in the 3D path (chunk load, texture, context) drops to the flat scene. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('3D dorm failed, using flat scene', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FlatDorm({ micUnlocked, lightsUnlocked }: Pick<DormRoom3DProps, 'micUnlocked' | 'lightsUnlocked'>) {
  return (
    <div className="dorm-flat" aria-label="Your dorm room">
      <img className="dorm-bg" src={ASSETS.dormBackground} alt="" />
      <div className="dorm-flat-items">
        {lightsUnlocked && (
          <div className="dorm-slot slot-lights">
            <img className="item" src={ASSETS.rgbLights} alt="RGB lights, unlocked" />
          </div>
        )}
        <div className="dorm-slot slot-avatar">
          <img
            className="item"
            src={micUnlocked ? ASSETS.avatarMic : ASSETS.avatar}
            alt={micUnlocked ? 'You, holding your microphone' : 'You, in the dorm'}
          />
        </div>
      </div>
    </div>
  );
}

/** Dorm panel: the lazy walkable room, or the flat photo scene when it cannot run. */
export function DormScene(props: DormRoom3DProps) {
  const [canUse3D] = useState(supportsWebGL);
  const flat = <FlatDorm micUnlocked={props.micUnlocked} lightsUnlocked={props.lightsUnlocked} />;

  return (
    <div className="dorm-scene">
      {canUse3D ? (
        <SceneBoundary fallback={flat}>
          <Suspense fallback={flat}>
            <DormRoom3D {...props} />
          </Suspense>
        </SceneBoundary>
      ) : (
        flat
      )}
    </div>
  );
}
