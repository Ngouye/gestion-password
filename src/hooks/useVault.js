import { useCallback, useState } from 'react';
import { getSupabase } from '../lib/supabaseLoader';
import { decryptEntry, encryptEntry } from '../lib/crypto';

const TABLE = 'passwords';
const NETWORK_ERROR = 'Connexion impossible. Vérifiez votre accès à Internet et réessayez.';

export function useVault(userId, notify) {
  const [key, setKey] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const lock = useCallback(() => {
    setKey(null);
    setEntries([]);
  }, []);

  const unlock = useCallback(async (newKey) => {
    setKey(newKey);
    setLoading(true);
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEntries(await Promise.all(data.map((row) => decryptEntry(newKey, row))));
    } catch {
      notify('Impossible de charger le coffre. Vérifiez votre connexion.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const saveEntry = useCallback(async (values, id) => {
    try {
      const [payload, supabase] = await Promise.all([encryptEntry(key, values), getSupabase()]);
      const query = id
        ? supabase.from(TABLE).update(payload).eq('id', id)
        : supabase.from(TABLE).insert({ ...payload, user_id: userId });
      const { data, error } = await query.select();

      // Sans erreur mais sans ligne renvoyée : la requête a été filtrée par la RLS.
      if (error || !data?.length) {
        notify(id ? 'Modification refusée par le serveur.' : "Échec de l'enregistrement.", 'error');
        return false;
      }
      const saved = { ...data[0], ...values, legacy: false, unreadable: false };
      setEntries((prev) => (id ? prev.map((e) => (e.id === id ? saved : e)) : [saved, ...prev]));
      notify(id ? 'Élément mis à jour.' : 'Élément ajouté au coffre.');
      return true;
    } catch {
      notify(NETWORK_ERROR, 'error');
      return false;
    }
  }, [key, userId, notify]);

  const deleteEntry = useCallback(async (id) => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.from(TABLE).delete().eq('id', id).select('id');
      if (error || !data?.length) {
        notify('Suppression impossible.', 'error');
        return;
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      notify('Élément supprimé.');
    } catch {
      notify(NETWORK_ERROR, 'error');
    }
  }, [notify]);

  const encryptLegacy = useCallback(async () => {
    const legacy = entries.filter((e) => e.legacy);
    let done = 0;
    try {
      const supabase = await getSupabase();
      for (const entry of legacy) {
        const payload = await encryptEntry(key, entry);
        const { data, error } = await supabase.from(TABLE).update(payload).eq('id', entry.id).select('id');
        if (!error && data?.length) {
          done++;
          setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, legacy: false } : e)));
        }
      }
    } catch {
      // Les éléments déjà chiffrés sont conservés ; le compte rendu ci-dessous l'indique.
    }
    if (done === legacy.length) {
      notify(`${done} élément(s) chiffré(s).`);
    } else {
      notify(`${done}/${legacy.length} élément(s) chiffré(s). Vérifiez votre connexion et la politique RLS UPDATE.`, 'error');
    }
  }, [entries, key, notify]);

  return { key, entries, loading, unlock, lock, saveEntry, deleteEntry, encryptLegacy };
}
