// Chiffrement côté client : les données quittent le navigateur déjà chiffrées.
//
// Le coffre est chiffré (AES-256-GCM) avec une clé de données. Celle-ci est stockée
// sous deux enveloppes : l'une scellée par le mot de passe maître, l'autre par la clé
// de secours. Changer de mot de passe maître revient à refaire la première enveloppe.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PREFIX = 'v1:';
const PBKDF2_ITERATIONS = 600_000;
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function toBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function pbkdf2Bytes(secret, salt) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    256,
  );
  return new Uint8Array(bits);
}

export const importDataKey = (raw) =>
  crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

export const generateDataKeyBytes = () => crypto.getRandomValues(new Uint8Array(32));

// Coffres créés avant les clés de secours : la clé de données était dérivée du mot de passe.
export const deriveLegacyKeyBytes = (password, userId) => pbkdf2Bytes(password, `securevault:${userId}`);

// Clé qui scelle l'enveloppe « mot de passe » (sel distinct de la clé historique).
export async function derivePasswordWrapKey(password, userId) {
  return importDataKey(await pbkdf2Bytes(password, `securevault:kek:${userId}`));
}

// 32 symboles tirés sans biais (256 est multiple de 32) : 160 bits d'entropie.
export function generateRecoveryKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const symbols = Array.from(bytes, (byte) => RECOVERY_ALPHABET[byte % 32]).join('');
  return symbols.match(/.{4}/g).join('-');
}

export const normalizeRecoveryKey = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

// La clé de secours est déjà aléatoire : HKDF suffit, pas besoin d'étirement coûteux.
export async function deriveRecoveryWrapKey(recoveryKey, userId) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(normalizeRecoveryKey(recoveryKey)),
    'HKDF',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(`securevault:recovery:${userId}`),
      info: encoder.encode('vault-data-key'),
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export const isEncrypted = (value) => typeof value === 'string' && value.startsWith(PREFIX);

async function encrypt(key, plaintext) {
  if (!plaintext) return '';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
  return `${PREFIX}${toBase64(iv)}:${toBase64(new Uint8Array(ciphertext))}`;
}

async function decrypt(key, value) {
  // Les entrées créées avant le chiffrement sont restituées telles quelles.
  if (!isEncrypted(value)) return value ?? '';
  const [, iv, ciphertext] = value.split(':');
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext),
  );
  return decoder.decode(plaintext);
}

export const wrapDataKey = (wrapKey, raw) => encrypt(wrapKey, toBase64(raw));

// Échoue (authentification GCM) si la clé qui scelle l'enveloppe est incorrecte.
export async function unwrapDataKey(wrapKey, envelope) {
  if (!isEncrypted(envelope)) throw new Error('Enveloppe de clé invalide.');
  return fromBase64(await decrypt(wrapKey, envelope));
}

export async function encryptEntry(key, { title, username, password }) {
  const [encTitle, encUsername, encPassword] = await Promise.all(
    [title, username, password].map((value) => encrypt(key, value)),
  );
  return { title: encTitle, username: encUsername, password: encPassword };
}

export async function decryptEntry(key, row) {
  try {
    const [title, username, password] = await Promise.all(
      [row.title, row.username, row.password].map((value) => decrypt(key, value)),
    );
    return { ...row, title, username, password, legacy: !isEncrypted(row.password), unreadable: false };
  } catch {
    return { ...row, title: 'Élément illisible', username: '', password: '', legacy: false, unreadable: true };
  }
}
