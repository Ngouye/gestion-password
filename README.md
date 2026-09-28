# SecureVault

Gestionnaire de mots de passe chiffré côté client, synchronisé via Supabase.

## Fonctionnalités

- **Chiffrement local** : service, identifiant et mot de passe sont chiffrés en AES-256-GCM dans le navigateur avant l'envoi ; la clé n'est jamais transmise en clair.
- **Générateur cryptographique** : `crypto.getRandomValues`, tirage sans biais, au moins un caractère de chaque famille choisie.
- **Clé de secours** : remise à la création du coffre, elle permet de choisir un nouveau mot de passe maître en cas d'oubli, sans perdre de données.
- **Verrouillage** automatique après 5 minutes d'inactivité, ou manuel.
- Presse-papiers vidé 30 s après la copie d'un secret.
- Recherche, ajout, modification et suppression (avec confirmation).
- Interface claire/sombre selon le thème du système, responsive.

## Installation

```bash
npm install
cp .env.example .env   # puis renseigner l'URL et la clé anon du projet Supabase
npm run dev
```

Exécutez ensuite [`supabase/policies.sql`](supabase/policies.sql) dans l'éditeur SQL de Supabase : il active la Row Level Security sur `passwords` et crée la table `vault_keys` nécessaire aux clés de secours.

### Connexion Google, GitHub et Facebook

Les boutons restent grisés tant que le fournisseur n'est pas activé dans Supabase.

1. **Supabase → Authentication → URL Configuration** : ajoutez l'URL de l'application (`http://localhost:5173` en développement, puis l'URL de production) dans *Redirect URLs*.
2. **Supabase → Authentication → Providers** : activez chaque fournisseur avec son *Client ID* et son *Client Secret*. L'URL de rappel à déclarer chez le fournisseur est `https://<votre-projet>.supabase.co/auth/v1/callback`.
   - Google : Google Cloud Console → API et services → Identifiants → ID client OAuth (application Web).
   - GitHub : Settings → Developer settings → OAuth Apps → New OAuth App.
   - Facebook : developers.facebook.com → Créer une app → produit « Facebook Login ».

### Déploiement (Vercel)

[`vercel.json`](vercel.json) applique les en-têtes de sécurité (CSP stricte, HSTS, anti-clickjacking, `no-referrer`) et met en cache longue durée les fichiers `assets/`. `npm run preview` sert les mêmes en-têtes en local. Pensez à définir `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les variables d'environnement du projet Vercel.

## Modèle de sécurité

- Le coffre est chiffré avec une **clé de données** aléatoire (AES-256-GCM). Elle est stockée dans `vault_keys` sous deux enveloppes chiffrées : l'une scellée par le mot de passe maître (PBKDF2, 600 000 itérations), l'autre par la clé de secours (160 bits, HKDF). Le serveur ne voit jamais la clé de données.
- **Mot de passe maître oublié** : la clé de secours ouvre la seconde enveloppe, puis l'utilisateur choisit un nouveau mot de passe ; seule la première enveloppe est refaite, les données ne sont pas re-chiffrées. Pour un compte e-mail, un lien « Mot de passe oublié » rétablit d'abord l'accès au compte.
- **Sans mot de passe ni clé de secours**, les données restent indéchiffrables ; l'utilisateur peut repartir d'un coffre vide.
- Les coffres créés avant les clés de secours sont migrés à la connexion suivante, et la clé de secours est alors affichée.

- **Compte e-mail** : le mot de passe de connexion est aussi le mot de passe maître. Le serveur n'en stocke que le hash, mais le reçoit lors de la connexion (via TLS).
- **Google, GitHub, Facebook** : le fournisseur prouve l'identité ; à la première connexion, l'utilisateur définit un mot de passe maître distinct, vérifié localement par l'ouverture de son enveloppe : il ne quitte jamais le navigateur.
- À l'inscription, le prénom et le nom sont enregistrés dans les métadonnées de l'utilisateur (`first_name`, `last_name`, `full_name`).
- Les éléments créés avant l'introduction du chiffrement sont signalés « Non chiffré » et peuvent être chiffrés en un clic.
