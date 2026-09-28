// Évalué avant le client Supabase (voir main.jsx), qui lit ensuite le ?code= restant.
// - ?error_description=… : erreur renvoyée par un fournisseur OAuth ou un lien expiré ;
// - ?reinitialisation : retour du lien « mot de passe oublié » envoyé par e-mail.
const url = new URL(window.location.href);
const description = url.searchParams.get('error_description');

export const oauthError = description ? `Connexion impossible : ${description}` : null;
export const passwordRecoveryRequested = url.searchParams.has('reinitialisation') && !description;

if (description) {
  url.search = '';
  url.hash = 'connexion';
} else if (passwordRecoveryRequested) {
  // Si l'échange du lien échoue, l'utilisateur arrive sur l'écran de connexion.
  url.hash = 'connexion';
}
url.searchParams.delete('reinitialisation');
if (url.href !== window.location.href) window.history.replaceState(null, '', url);

// Sans jeton enregistré ni retour d'authentification dans l'URL, le visiteur n'est pas connecté :
// on affiche l'accueil immédiatement au lieu d'attendre l'initialisation de Supabase.
function hasStoredSession() {
  try {
    return Object.keys(window.localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token'));
  } catch {
    return true;
  }
}

export const mayHaveSession = hasStoredSession() || new URLSearchParams(window.location.search).has('code');
