import { supabase } from '../supabaseClient';
import {
  deriveLegacyKeyBytes, derivePasswordWrapKey, deriveRecoveryWrapKey, generateDataKeyBytes, generateRecoveryKey,
  importDataKey, unwrapDataKey, wrapDataKey,
} from './crypto';

const TABLE = 'vault_keys';
const MISSING_TABLE_CODES = ['PGRST205', '42P01'];
const PROVIDER_NAMES = { google: 'Google', github: 'GitHub', facebook: 'Facebook', email: 'e-mail' };

export const providerName = (user) => PROVIDER_NAMES[user?.app_metadata?.provider] ?? 'votre compte';

// Compte avec identifiant e-mail : le mot de passe de connexion est aussi le mot de passe maître.
export function hasPasswordLogin(user) {
  const providers = user?.app_metadata?.providers ?? [user?.app_metadata?.provider];
  return providers.includes('email');
}

// Google, GitHub, Facebook : le coffre doit être créé (mot de passe maître) à la première connexion.
export const needsVaultSetup = (user) => !hasPasswordLogin(user) && !user?.user_metadata?.vault_ready;

const MISSING_TABLE_MESSAGE =
  'Les clés de secours ne sont pas activées : exécutez supabase/policies.sql dans l’éditeur SQL de Supabase.';

async function fetchEnvelopes() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('wrapped_by_password, wrapped_by_recovery')
    .maybeSingle();
  if (error) {
    if (MISSING_TABLE_CODES.includes(error.code)) return { available: false, envelopes: null };
    throw error;
  }
  return { available: true, envelopes: data };
}

async function writeEnvelopes(userId, fields) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, ...fields, updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function updateEnvelopes(userId, fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('user_id');
  if (error) throw error;
  if (!data.length) throw new Error('Mise à jour refusée par le serveur.');
}

async function sealVault(userId, password, raw) {
  const recoveryKey = generateRecoveryKey();
  const [byPassword, byRecovery] = await Promise.all([
    derivePasswordWrapKey(password, userId).then((wrapKey) => wrapDataKey(wrapKey, raw)),
    deriveRecoveryWrapKey(recoveryKey, userId).then((wrapKey) => wrapDataKey(wrapKey, raw)),
  ]);
  await writeEnvelopes(userId, { wrapped_by_password: byPassword, wrapped_by_recovery: byRecovery });
  return recoveryKey;
}

async function openWithPassword(user, password, envelope) {
  try {
    const raw = await unwrapDataKey(await derivePasswordWrapKey(password, user.id), envelope);
    return importDataKey(raw);
  } catch {
    throw new Error('Mot de passe maître incorrect.');
  }
}

/**
 * Ouvre le coffre existant. `loginVerified` indique que le mot de passe vient d'être
 * validé par Supabase (connexion e-mail), seule vérification possible pour un coffre historique.
 * Retourne { key, recoveryKey?, recoveryUnavailable? } ; `recoveryKey` est à montrer une fois.
 */
export async function openVault(user, password, { loginVerified = false } = {}) {
  const { available, envelopes } = await fetchEnvelopes();
  if (envelopes) return { key: await openWithPassword(user, password, envelopes.wrapped_by_password) };

  if (!hasPasswordLogin(user)) throw new Error(available ? 'Aucun coffre trouvé pour ce compte.' : MISSING_TABLE_MESSAGE);

  if (!loginVerified) {
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (error) throw error;
  }
  // Coffre historique : sa clé devient la clé de données, puis on crée les enveloppes.
  const raw = await deriveLegacyKeyBytes(password, user.id);
  const key = await importDataKey(raw);
  if (!available) return { key, recoveryUnavailable: true };
  return { key, recoveryKey: await sealVault(user.id, password, raw) };
}

export async function createVault(user, password, profile) {
  const { available, envelopes } = await fetchEnvelopes();
  if (envelopes) {
    // Le coffre existe déjà (indicateur de profil perdu) : on l'ouvre au lieu de l'écraser.
    try {
      return { key: await openWithPassword(user, password, envelopes.wrapped_by_password) };
    } catch {
      throw new Error('Ce compte possède déjà un coffre : saisissez le mot de passe maître choisi à sa création.');
    }
  }

  if (!available) {
    if (!hasPasswordLogin(user)) throw new Error(MISSING_TABLE_MESSAGE);
    return { key: await importDataKey(await deriveLegacyKeyBytes(password, user.id)), recoveryUnavailable: true };
  }

  const raw = generateDataKeyBytes();
  const recoveryKey = await sealVault(user.id, password, raw);
  if (!hasPasswordLogin(user)) {
    const { error } = await supabase.auth.updateUser({ data: { ...profile, vault_ready: true } });
    if (error) throw error;
  }
  return { key: await importDataKey(raw), recoveryKey };
}

async function changeLoginPassword(user, newPassword) {
  if (!hasPasswordLogin(user)) return;
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  // Nouvelle tentative après un échec partiel : le mot de passe est déjà le bon.
  if (error && error.code !== 'same_password') throw error;
}

// Mot de passe maître oublié : la clé de secours déverrouille la clé de données.
export async function recoverVault(user, recoveryKey, newPassword) {
  const { available, envelopes } = await fetchEnvelopes();
  if (!available) throw new Error(MISSING_TABLE_MESSAGE);
  if (!envelopes) throw new Error('Aucune clé de secours n’est associée à ce compte.');

  let raw;
  try {
    raw = await unwrapDataKey(await deriveRecoveryWrapKey(recoveryKey, user.id), envelopes.wrapped_by_recovery);
  } catch {
    throw new Error('Clé de secours invalide.');
  }

  await changeLoginPassword(user, newPassword);
  const wrapKey = await derivePasswordWrapKey(newPassword, user.id);
  await updateEnvelopes(user.id, { wrapped_by_password: await wrapDataKey(wrapKey, raw) });
  return { key: await importDataKey(raw) };
}

// Dernier recours sans clé de secours : nouveau coffre vide, les anciens éléments restent illisibles.
export async function resetVault(user, newPassword) {
  const { available } = await fetchEnvelopes();
  if (!available) throw new Error(MISSING_TABLE_MESSAGE);
  await changeLoginPassword(user, newPassword);
  const raw = generateDataKeyBytes();
  return { key: await importDataKey(raw), recoveryKey: await sealVault(user.id, newPassword, raw) };
}

// Remplace la clé de secours (perdue ou compromise) ; exige le mot de passe maître.
export async function regenerateRecoveryKey(user, password) {
  const { available, envelopes } = await fetchEnvelopes();
  if (!available) throw new Error(MISSING_TABLE_MESSAGE);
  if (!envelopes) throw new Error('Aucun coffre trouvé pour ce compte.');

  let raw;
  try {
    raw = await unwrapDataKey(await derivePasswordWrapKey(password, user.id), envelopes.wrapped_by_password);
  } catch {
    throw new Error('Mot de passe maître incorrect.');
  }
  const recoveryKey = generateRecoveryKey();
  const wrapKey = await deriveRecoveryWrapKey(recoveryKey, user.id);
  await updateEnvelopes(user.id, { wrapped_by_recovery: await wrapDataKey(wrapKey, raw) });
  return recoveryKey;
}
