import { PointerEvent, useRef } from 'react';

export interface JoystickProps {
  /** x: right, y: forward, each in [-1, 1]. */
  onChange: (stick: { x: number; y: number }) => void;
}

const KNOB_TRAVEL = 34;

export function Joystick({ onChange }: JoystickProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const update = (clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const scale = Math.min(1, KNOB_TRAVEL / (Math.hypot(dx, dy) || 1));
    const x = dx * scale;
    const y = dy * scale;
    if (knobRef.current) knobRef.current.style.transform = `translate(${x}px, ${y}px)`;
    onChange({ x: x / KNOB_TRAVEL, y: -y / KNOB_TRAVEL });
  };

  const release = () => {
    if (knobRef.current) knobRef.current.style.transform = '';
    onChange({ x: 0, y: 0 });
  };

  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    centerRef.current = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    event.currentTarget.setPointerCapture(event.pointerId);
    update(event.clientX, event.clientY);
  };

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      update(event.clientX, event.clientY);
    }
  };

  return (
    <div
      className="room-joystick"
      role="application"
      aria-label="Move your character. On a keyboard, use W A S D or the arrow keys."
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className="room-joystick-knob" ref={knobRef} />
    </div>
  );
}
