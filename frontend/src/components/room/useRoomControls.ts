import { PointerEvent, useCallback, useEffect, useRef } from 'react';
import { moveVector } from './movement';

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
/** Radians of camera yaw per pixel dragged. */
const DRAG_YAW_RATE = 0.008;

/** Typing in the stand-up fields must not walk the character. */
function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export interface InteractKeyHandlers {
  onPress: (code: string) => void;
  onRelease: (code: string) => void;
}

/** Keyboard and joystick state, read once per frame by the player. */
export function useMoveInput(handlers: InteractKeyHandlers) {
  const keysRef = useRef(new Set<string>());
  const stickRef = useRef({ x: 0, y: 0 });
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const keys = keysRef.current;
    const handleDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      keys.add(event.code);
      if (MOVE_KEYS.has(event.code)) {
        event.preventDefault();
      } else if (!event.repeat) {
        handlersRef.current.onPress(event.code);
      }
    };
    const handleUp = (event: KeyboardEvent) => {
      keys.delete(event.code);
      if (!MOVE_KEYS.has(event.code)) handlersRef.current.onRelease(event.code);
    };
    // A key released while the window is unfocused never fires keyup.
    const handleBlur = () => {
      keys.forEach((code) => {
        if (!MOVE_KEYS.has(code)) handlersRef.current.onRelease(code);
      });
      keys.clear();
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const readInput = useCallback(() => moveVector(keysRef.current, stickRef.current), []);
  const setStick = useCallback((stick: { x: number; y: number }) => {
    stickRef.current = stick;
  }, []);

  return { readInput, setStick };
}

/**
 * Drag-to-turn. Uses window listeners rather than pointer capture because capture
 * would retarget the click away from the canvas and break tapping on spots.
 */
export function useDragYaw(initialYaw: number) {
  const yawRef = useRef(initialYaw);
  const dragRef = useRef<{ pointerId: number; lastX: number } | null>(null);

  useEffect(() => {
    const handleMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      yawRef.current -= (event.clientX - drag.lastX) * DRAG_YAW_RATE;
      dragRef.current = { ...drag, lastX: event.clientX };
    };
    const handleEnd = (event: globalThis.PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };
  }, []);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!dragRef.current) {
      dragRef.current = { pointerId: event.pointerId, lastX: event.clientX };
    }
  }, []);

  return { yawRef, onPointerDown };
}
