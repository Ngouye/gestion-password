import { useEffect } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];

export function useIdleLock(active, timeoutMs, onIdle) {
  useEffect(() => {
    if (!active) return undefined;
    let lastActivity = Date.now();
    let timer = setTimeout(onIdle, timeoutMs);

    const reset = () => {
      lastActivity = Date.now();
      clearTimeout(timer);
      timer = setTimeout(onIdle, timeoutMs);
    };

    // Les téléphones gèlent les minuteurs en arrière-plan : on vérifie au retour sur l'onglet.
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivity >= timeoutMs) onIdle();
      else reset();
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset));
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [active, timeoutMs, onIdle]);
}
