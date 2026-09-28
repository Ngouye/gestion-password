const MESSAGES = {
  invalid_credentials: 'Adresse e-mail ou mot de passe incorrect.',
  email_not_confirmed: 'Adresse e-mail non confirmée. Vérifiez votre boîte de réception.',
  user_already_exists: 'Un compte existe déjà avec cette adresse.',
  weak_password: 'Mot de passe trop faible.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
  over_email_send_rate_limit: "Trop d'e-mails envoyés. Réessayez dans quelques minutes.",
  unexpected_failure: 'Le serveur n’a pas pu créer le compte. Réessayez plus tard ou contactez le support.',
};

export function describeAuthError(error) {
  return MESSAGES[error?.code] ?? error?.message ?? 'Une erreur inattendue est survenue.';
}
