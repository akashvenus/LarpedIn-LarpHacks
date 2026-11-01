import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs onComplete once the hold has lasted durationMs; ending it early or losing isEnabled cancels. */
export function useHoldAction(durationMs: number, isEnabled: boolean, onComplete: () => void) {
  const [isPressed, setIsPressed] = useState(false);
  const isHolding = isPressed && isEnabled;
  // Kept in a ref: a new callback identity must not restart the timer on every render.
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    if (!isHolding) return undefined;
    const timer = window.setTimeout(() => {
      setIsPressed(false);
      completeRef.current();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [isHolding, durationMs]);

  const startHold = useCallback(() => setIsPressed(true), []);
  const endHold = useCallback(() => setIsPressed(false), []);

  return { isHolding, startHold, endHold };
}
