import { useEffect, useState } from 'react';
import { supabaseAnonKey, supabaseUrl } from '../supabaseClient';

// Fournisseurs OAuth activés dans le projet Supabase (null tant que inconnu).
export function useAuthProviders() {
  const [enabled, setEnabled] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseAnonKey } })
      .then((res) => (res.ok ? res.json() : null))
      .then((settings) => {
        if (!cancelled && settings) setEnabled(settings.external ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
