import { useEffect } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];

export function useIdleLock(active, timeoutMs, onIdle) {
  useEffect(() => {
    if (!active) return undefined;
    let timer = setTimeout(onIdle, timeoutMs);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(onIdle, timeoutMs);
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [active, timeoutMs, onIdle]);
}
