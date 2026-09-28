const CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/~',
};

export const DEFAULT_OPTIONS = { length: 20, upper: true, digits: true, symbols: true };

// Entier uniforme dans [0, max) via tirage par rejet (pas de biais de modulo).
function randomInt(max) {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function generatePassword({ length, upper, digits, symbols }) {
  const pools = [CHARSETS.lower];
  if (upper) pools.push(CHARSETS.upper);
  if (digits) pools.push(CHARSETS.digits);
  if (symbols) pools.push(CHARSETS.symbols);
  const charset = pools.join('');

  // Au moins un caractère de chaque famille sélectionnée, puis mélange de Fisher-Yates.
  const chars = pools.map((pool) => pool[randomInt(pool.length)]);
  while (chars.length < length) chars.push(charset[randomInt(charset.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Fort', 'Excellent'];

export function passwordStrength(password) {
  if (!password) return { score: 0, bits: 0, label: '' };
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
  const bits = Math.round(password.length * Math.log2(pool));
  const score = bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  return { score, bits, label: STRENGTH_LABELS[score] };
}
