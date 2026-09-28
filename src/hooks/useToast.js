import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 2800;

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((message, type = 'success') => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, type });
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [toast, notify];
}
