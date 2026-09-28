export const CLIPBOARD_CLEAR_SECONDS = 30;

let clearTimer;

export async function copySecret(text) {
  await navigator.clipboard.writeText(text);
  clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    // Échoue si l'onglet n'a plus le focus : rien d'autre à faire côté navigateur.
    navigator.clipboard.writeText('').catch(() => {});
  }, CLIPBOARD_CLEAR_SECONDS * 1000);
}
